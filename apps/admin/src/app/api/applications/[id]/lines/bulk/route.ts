import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bulkUpdateSchema = z.object({
  lineIds: z.array(z.string()).min(1),
  lineTagId: z.number().int().positive().optional().nullable(),
  lineReserveTagId: z.number().int().positive().optional().nullable(),
  contractMonth: z.coerce.date().optional().nullable(),
  shippedAt: z.coerce.date().optional().nullable(),
  returnedAt: z.coerce.date().optional().nullable(),
});

// 回線一括更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = bulkUpdateSchema.parse(body);

    // 申し込みの存在確認
    const application = await prisma.application.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "申し込みが見つかりません" },
        { status: 404 }
      );
    }

    // 指定された回線が申し込みに属しているか確認
    const lines = await prisma.applicationLine.findMany({
      where: {
        id: { in: validated.lineIds },
        applicationId: id,
      },
    });

    if (lines.length !== validated.lineIds.length) {
      return NextResponse.json(
        { error: "指定された回線の一部が見つからないか、この申し込みに属していません" },
        { status: 400 }
      );
    }

    // lineTagIdの存在確認
    if (validated.lineTagId) {
      const tag = await prisma.lineTag.findUnique({
        where: { id: validated.lineTagId },
      });
      if (!tag) {
        return NextResponse.json(
          { error: "指定された回線タグが見つかりません" },
          { status: 400 }
        );
      }
    }

    // lineReserveTagIdの存在確認
    if (validated.lineReserveTagId) {
      const tag = await prisma.lineReserveTag.findUnique({
        where: { id: validated.lineReserveTagId },
      });
      if (!tag) {
        return NextResponse.json(
          { error: "指定された回線予備タグが見つかりません" },
          { status: 400 }
        );
      }
    }

    // 更新データを構築（undefinedは除外）
    const updateData: Record<string, unknown> = {};
    if (validated.lineTagId !== undefined) {
      updateData.lineTagId = validated.lineTagId;
    }
    if (validated.lineReserveTagId !== undefined) {
      updateData.lineReserveTagId = validated.lineReserveTagId;
    }
    if (validated.contractMonth !== undefined) {
      updateData.contractMonth = validated.contractMonth;
    }
    if (validated.shippedAt !== undefined) {
      updateData.shippedAt = validated.shippedAt;
      // 発送日が設定された場合、ステータスも更新
      if (validated.shippedAt) {
        updateData.status = "SHIPPED";
      }
    }
    if (validated.returnedAt !== undefined) {
      updateData.returnedAt = validated.returnedAt;
      // 返却日が設定された場合、ステータスも更新
      if (validated.returnedAt) {
        updateData.status = "RETURNED";
      }
    }

    // 一括更新
    const result = await prisma.applicationLine.updateMany({
      where: {
        id: { in: validated.lineIds },
        applicationId: id,
      },
      data: updateData,
    });

    return NextResponse.json({
      message: `${result.count}件の回線を更新しました`,
      updatedCount: result.count,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("回線一括更新エラー:", error);
    return NextResponse.json(
      { error: "回線の一括更新に失敗しました" },
      { status: 500 }
    );
  }
}
