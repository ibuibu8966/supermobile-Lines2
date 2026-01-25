import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

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

// 販売可能な用途タグを取得
async function getAvailableTags(sim: {
  consumedTagIds: number[];
  supplierId: number;
  carrierType: string | null;
  plan: string | null;
  isMnpEligible: boolean;
  supplier: { code: string };
}) {
  // 全てのアクティブな用途タグを取得
  const allTags = await prisma.usageTag.findMany({
    where: { isActive: true },
  });

  // 各タグのルールをチェック
  const availableTags: typeof allTags = [];

  for (const tag of allTags) {
    // すでに消費済みならスキップ
    if (sim.consumedTagIds.includes(tag.id)) {
      continue;
    }

    // このタグのルールを取得
    const rules = await prisma.usageRule.findMany({
      where: {
        usageTagId: tag.id,
        isActive: true,
      },
      orderBy: {
        priority: "desc",
      },
    });

    // ルールがない場合は販売可能
    if (rules.length === 0) {
      availableTags.push(tag);
      continue;
    }

    // いずれかのルールを満たすかチェック
    let isAvailable = false;
    for (const rule of rules) {
      if (checkRule(rule, sim)) {
        isAvailable = true;
        break;
      }
    }

    if (isAvailable) {
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
