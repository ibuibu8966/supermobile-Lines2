import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@repo/database";
import { z } from "zod";

const updateUsageRuleSchema = z.object({
  usageTagId: z.number().int().positive().optional(),
  supplierFilter: z.string().max(50).optional().nullable(),
  carrierFilter: z.enum(["DOCOMO", "AU", "SOFTBANK", "RAKUTEN"]).optional().nullable(),
  planFilter: z.string().max(100).optional().nullable(),
  excludedTagIds: z.array(z.number().int()).optional(),
  minContractDays: z.number().int().min(0).optional(),
  requiresMnp: z.boolean().optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// 詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ruleId = parseInt(id);

    if (isNaN(ruleId)) {
      return NextResponse.json(
        { error: "無効なIDです" },
        { status: 400 }
      );
    }

    const rule = await prisma.usageRule.findUnique({
      where: { id: ruleId },
      include: {
        usageTag: true,
      },
    });

    if (!rule) {
      return NextResponse.json(
        { error: "販売ルールが見つかりません" },
        { status: 404 }
      );
    }

    // 排他タグの情報を取得
    const excludedTags = rule.excludedTagIds.length > 0
      ? await prisma.usageTag.findMany({
          where: { id: { in: rule.excludedTagIds } },
        })
      : [];

    return NextResponse.json({
      ...rule,
      excludedTags,
    });
  } catch (error) {
    console.error("販売ルール詳細取得エラー:", error);
    return NextResponse.json(
      { error: "販売ルールの取得に失敗しました" },
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
    const ruleId = parseInt(id);

    if (isNaN(ruleId)) {
      return NextResponse.json(
        { error: "無効なIDです" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = updateUsageRuleSchema.parse(body);

    // usageTagIdをPrismaのリレーション形式に変換、conditionsをPrisma JSON型に変換
    const { usageTagId, conditions, ...otherFields } = validated;
    const updateData: Prisma.UsageRuleUpdateInput = { ...otherFields };
    if (usageTagId !== undefined) {
      updateData.usageTag = { connect: { id: usageTagId } };
    }
    if (conditions !== undefined) {
      updateData.conditions = conditions as Prisma.JsonObject;
    }

    const rule = await prisma.usageRule.update({
      where: { id: ruleId },
      data: updateData,
      include: {
        usageTag: true,
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("販売ルール更新エラー:", error);
    return NextResponse.json(
      { error: "販売ルールの更新に失敗しました" },
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
    const ruleId = parseInt(id);

    if (isNaN(ruleId)) {
      return NextResponse.json(
        { error: "無効なIDです" },
        { status: 400 }
      );
    }

    await prisma.usageRule.delete({
      where: { id: ruleId },
    });

    return NextResponse.json({ message: "販売ルールを削除しました" });
  } catch (error) {
    console.error("販売ルール削除エラー:", error);
    return NextResponse.json(
      { error: "販売ルールの削除に失敗しました" },
      { status: 500 }
    );
  }
}
