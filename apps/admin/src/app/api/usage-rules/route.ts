import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@repo/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

const usageRuleSchema = z.object({
  usageTagId: z.number().int().positive("用途タグを選択してください"),
  supplierFilter: z.string().max(50).optional().nullable(),
  carrierFilter: z.enum(["DOCOMO", "AU", "SOFTBANK", "RAKUTEN"]).optional().nullable(),
  planFilter: z.string().max(100).optional().nullable(),
  excludedTagIds: z.array(z.number().int()).optional().default([]),
  minContractDays: z.number().int().min(0).optional().default(0),
  requiresMnp: z.boolean().optional().default(false),
  conditions: z.record(z.string(), z.unknown()).optional().default({}),
  priority: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

// 一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get("includeInactive") === "true";
    const usageTagId = searchParams.get("usageTagId");

    const where: Record<string, unknown> = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (usageTagId) {
      where.usageTagId = parseInt(usageTagId);
    }

    const rules = await prisma.usageRule.findMany({
      where,
      include: {
        usageTag: true,
      },
      orderBy: [{ usageTagId: "asc" }, { priority: "desc" }],
    });

    // 排他タグの情報を取得
    const allExcludedTagIds = rules.flatMap((r) => r.excludedTagIds);
    const uniqueTagIds = [...new Set(allExcludedTagIds)];

    const excludedTags = uniqueTagIds.length > 0
      ? await prisma.usageTag.findMany({
          where: { id: { in: uniqueTagIds } },
        })
      : [];

    const tagMap = new Map(excludedTags.map((t) => [t.id, t]));

    const rulesWithTags = rules.map((rule) => ({
      ...rule,
      excludedTags: rule.excludedTagIds
        .map((id) => tagMap.get(id))
        .filter(Boolean),
    }));

    return NextResponse.json(rulesWithTags);
  } catch (error) {
    console.error("販売ルール一覧取得エラー:", error);
    return NextResponse.json(
      { error: "販売ルール一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 新規作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = usageRuleSchema.parse(body);

    // usageTagIdをリレーション形式に変換、conditionsをPrisma JSON型に変換
    const { usageTagId, conditions, ...otherFields } = validated;

    const rule = await prisma.usageRule.create({
      data: {
        ...otherFields,
        conditions: conditions as Prisma.JsonObject,
        usageTag: { connect: { id: usageTagId } },
      },
      include: {
        usageTag: true,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("販売ルール作成エラー:", error);
    return NextResponse.json(
      { error: "販売ルールの作成に失敗しました" },
      { status: 500 }
    );
  }
}
