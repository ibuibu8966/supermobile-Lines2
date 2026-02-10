import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

const updateCouponSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  planId: z.string().cuid().optional(),
  unitPrice: z.number().int().min(0).optional(),
  description: z.string().max(200).optional().nullable(),
  maxUsages: z.number().int().min(1).optional().nullable(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  isActive: z.boolean().optional(),
});

// 更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateCouponSchema.parse(body);

    const existing = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "クーポンが見つかりません" },
        { status: 404 }
      );
    }

    // コードの重複チェック（自分以外）
    if (validated.code) {
      const duplicate = await prisma.coupon.findFirst({
        where: {
          code: validated.code,
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "このクーポンコードは既に使用されています" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (validated.code !== undefined) updateData.code = validated.code;
    if (validated.planId !== undefined) updateData.planId = validated.planId;
    if (validated.unitPrice !== undefined) updateData.unitPrice = validated.unitPrice;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.maxUsages !== undefined) updateData.maxUsages = validated.maxUsages;
    if (validated.validFrom !== undefined) updateData.validFrom = new Date(validated.validFrom);
    if (validated.validUntil !== undefined) updateData.validUntil = new Date(validated.validUntil);
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
      include: {
        plan: {
          include: {
            service: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("クーポン更新エラー:", error);
    return NextResponse.json(
      { error: "クーポンの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// 削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "クーポンが見つかりません" },
        { status: 404 }
      );
    }

    if (coupon._count.applications > 0) {
      await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "クーポンを無効化しました" });
    }

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ message: "クーポンを削除しました" });
  } catch (error) {
    console.error("クーポン削除エラー:", error);
    return NextResponse.json(
      { error: "クーポンの削除に失敗しました" },
      { status: 500 }
    );
  }
}
