import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

const pricingSchema = z.object({
  id: z.string().cuid().optional(),
  customerType: z.enum(["INDIVIDUAL", "CORPORATE"]),
  minQuantity: z.number().int().min(1).default(1),
  maxQuantity: z.number().int().min(1).nullable().optional(),
  unitPrice: z.number().int().min(0),
  description: z.string().max(200).optional().nullable(),
});

const updatePlanSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  usageTagIds: z.array(z.number().int()).optional(),
  pricings: z.array(pricingSchema).optional(),
  isActive: z.boolean().optional(),
});

// 詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        service: true,
        usageTags: {
          include: {
            usageTag: true,
          },
        },
        pricings: {
          orderBy: [{ customerType: "asc" }, { minQuantity: "asc" }],
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "プランが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("プラン詳細取得エラー:", error);
    return NextResponse.json(
      { error: "プランの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updatePlanSchema.parse(body);

    const { usageTagIds, pricings, ...planData } = validated;

    // 既存プランの確認
    const existingPlan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: "プランが見つかりません" },
        { status: 404 }
      );
    }

    // コードの重複チェック（自分以外、同一サービス内）
    if (planData.code) {
      const existing = await prisma.plan.findFirst({
        where: {
          serviceId: existingPlan.serviceId,
          code: planData.code,
          id: { not: id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "このサービス内で同じコードが既に使用されています" },
          { status: 400 }
        );
      }
    }

    // トランザクションで更新
    const plan = await prisma.$transaction(async (tx) => {
      // 基本情報更新
      await tx.plan.update({
        where: { id },
        data: planData,
      });

      // 用途タグの更新
      if (usageTagIds !== undefined) {
        // 既存を削除
        await tx.planUsageTag.deleteMany({
          where: { planId: id },
        });
        // 新規作成
        if (usageTagIds.length > 0) {
          await tx.planUsageTag.createMany({
            data: usageTagIds.map((usageTagId) => ({
              planId: id,
              usageTagId,
            })),
          });
        }
      }

      // 料金の更新
      if (pricings !== undefined) {
        // 既存を削除
        await tx.planPricing.deleteMany({
          where: { planId: id },
        });
        // 新規作成
        if (pricings.length > 0) {
          await tx.planPricing.createMany({
            data: pricings.map((p) => ({
              planId: id,
              customerType: p.customerType,
              minQuantity: p.minQuantity,
              maxQuantity: p.maxQuantity ?? null,
              unitPrice: p.unitPrice,
              description: p.description ?? null,
            })),
          });
        }
      }

      // 更新後のデータを取得
      return tx.plan.findUnique({
        where: { id },
        include: {
          service: true,
          usageTags: {
            include: {
              usageTag: true,
            },
          },
          pricings: {
            orderBy: [{ customerType: "asc" }, { minQuantity: "asc" }],
          },
        },
      });
    });

    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("プラン更新エラー:", error);
    return NextResponse.json(
      { error: "プランの更新に失敗しました" },
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

    // 関連データがあるかチェック
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "プランが見つかりません" },
        { status: 404 }
      );
    }

    if (plan._count.applications > 0) {
      // 論理削除
      await prisma.plan.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "プランを無効化しました" });
    }

    await prisma.plan.delete({
      where: { id },
    });

    return NextResponse.json({ message: "プランを削除しました" });
  } catch (error) {
    console.error("プラン削除エラー:", error);
    return NextResponse.json(
      { error: "プランの削除に失敗しました" },
      { status: 500 }
    );
  }
}
