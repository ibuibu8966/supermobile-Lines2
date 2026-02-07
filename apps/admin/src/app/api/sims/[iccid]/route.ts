import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

const updateSimSchema = z.object({
  msisdn: z.string().regex(/^0\d{9,10}$/).optional().nullable(),
  simType: z.enum(["INDIVIDUAL", "CORPORATE"]).optional(),
  carrierType: z.enum(["DOCOMO", "AU", "SOFTBANK", "RAKUTEN"]).optional().nullable(),
  plan: z.string().optional().nullable(),
  isMnpEligible: z.boolean().optional(),
  isAutoCancel: z.boolean().optional(),
  autoCancelDate: z.coerce.date().optional().nullable(),
  mnpReservationNumber: z.string().max(20).optional().nullable(),
  mnpExpiryDate: z.coerce.date().optional().nullable(),
  status: z.enum(["IN_STOCK", "ACTIVE", "RETURNING", "RETIRED", "CANCELLED"]).optional(),
  simLocationTagId: z.number().int().positive().optional().nullable(),
});

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ iccid: string }> }
) {
  try {
    const { iccid } = await params;

    const sim = await prisma.sim.findUnique({
      where: { iccid },
      include: {
        supplier: true,
        simLocationTag: true,
        contracts: {
          include: {
            usageTags: {
              include: {
                usageTag: true,
              },
            },
            customer: {
              select: {
                id: true,
                lastName: true,
                firstName: true,
                companyName: true,
                type: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!sim) {
      return NextResponse.json(
        { error: "SIMが見つかりません" },
        { status: 404 }
      );
    }

    // 消費済みタグIDからタグ情報を取得
    const consumedTags = sim.consumedTagIds.length > 0
      ? await prisma.usageTag.findMany({
          where: { id: { in: sim.consumedTagIds } },
        })
      : [];

    // 販売可能な用途タグを取得（ルールに基づく）
    const availableTags = await getAvailableTags(sim);

    return NextResponse.json({
      ...sim,
      consumedTags,
      availableTags,
    });
  } catch (error) {
    console.error("SIM詳細取得エラー:", error);
    return NextResponse.json(
      { error: "SIM詳細の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ iccid: string }> }
) {
  try {
    const { iccid } = await params;
    const body = await request.json();
    const validated = updateSimSchema.parse(body);

    // SIMの存在確認
    const existing = await prisma.sim.findUnique({
      where: { iccid },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "SIMが見つかりません" },
        { status: 404 }
      );
    }

    // simLocationTagIdの存在確認
    if (validated.simLocationTagId) {
      const tag = await prisma.simLocationTag.findUnique({
        where: { id: validated.simLocationTagId },
      });
      if (!tag) {
        return NextResponse.json(
          { error: "指定されたSIMの場所タグが見つかりません" },
          { status: 400 }
        );
      }
    }

    const sim = await prisma.sim.update({
      where: { iccid },
      data: validated,
      include: {
        supplier: true,
        simLocationTag: true,
      },
    });

    return NextResponse.json(sim);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("SIM更新エラー:", error);
    return NextResponse.json(
      { error: "SIMの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// 販売可能な用途タグを取得
async function getAvailableTags(sim: {
  consumedTagIds: number[];
  supplierId: number;
  carrierType: string | null;
  plan: string | null;
  isMnpEligible: boolean;
  supplier: { code: string };
}) {
  // 全てのアクティブな用途タグとルールを一括取得（N+1回→2回のクエリ）
  const [allTags, allRules] = await Promise.all([
    prisma.usageTag.findMany({ where: { isActive: true } }),
    prisma.usageRule.findMany({
      where: { isActive: true },
      orderBy: { priority: "desc" },
    }),
  ]);

  // ルールをタグIDでグループ化
  const rulesByTagId = new Map<number, typeof allRules>();
  for (const rule of allRules) {
    const existing = rulesByTagId.get(rule.usageTagId) || [];
    existing.push(rule);
    rulesByTagId.set(rule.usageTagId, existing);
  }

  const availableTags: typeof allTags = [];

  for (const tag of allTags) {
    if (sim.consumedTagIds.includes(tag.id)) {
      continue;
    }

    const rules = rulesByTagId.get(tag.id) || [];

    if (rules.length === 0) {
      availableTags.push(tag);
      continue;
    }

    if (rules.some((rule) => checkRule(rule, sim))) {
      availableTags.push(tag);
    }
  }

  return availableTags;
}

// ルールをチェック
function checkRule(
  rule: {
    supplierFilter: string | null;
    carrierFilter: string | null;
    planFilter: string | null;
    excludedTagIds: number[];
    requiresMnp: boolean;
  },
  sim: {
    consumedTagIds: number[];
    carrierType: string | null;
    plan: string | null;
    isMnpEligible: boolean;
    supplier: { code: string };
  }
): boolean {
  // 仕入れ先フィルタ
  if (rule.supplierFilter && rule.supplierFilter !== sim.supplier.code) {
    return false;
  }

  // キャリアフィルタ
  if (rule.carrierFilter && rule.carrierFilter !== sim.carrierType) {
    return false;
  }

  // プランフィルタ
  if (rule.planFilter && rule.planFilter !== sim.plan) {
    return false;
  }

  // 排他タグチェック
  if (rule.excludedTagIds.length > 0) {
    const hasExcludedTag = rule.excludedTagIds.some((id) =>
      sim.consumedTagIds.includes(id)
    );
    if (hasExcludedTag) {
      return false;
    }
  }

  // MNP必須チェック
  if (rule.requiresMnp && !sim.isMnpEligible) {
    return false;
  }

  return true;
}
