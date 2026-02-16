import { NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 最適化: 3つのクエリをPromise.allで並列実行
    const [overviewResult, usageTags, activeLinesByPlan] = await Promise.all([
      // 1. 概要統計（3つのCOUNT）
      prisma.$queryRaw<Array<{ in_stock: bigint; active: bigint; returned: bigint }>>`
        SELECT
          (SELECT COUNT(*) FROM "Sim" WHERE status = 'IN_STOCK') as in_stock,
          (SELECT COUNT(*) FROM "ApplicationLine" WHERE status = 'ACTIVATED') as active,
          (SELECT COUNT(*) FROM "ApplicationLine" WHERE status = 'RETURNED') as returned
      `,

      // 2. 用途タグ一覧
      prisma.usageTag.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      }),

      // 3. プラン別アクティブ回線
      prisma.$queryRaw<Array<{
        planId: string;
        planCode: string;
        planName: string;
        serviceName: string;
        activeCount: bigint;
      }>>`
        SELECT
          p.id as "planId",
          p.code as "planCode",
          p.name as "planName",
          s.name as "serviceName",
          COUNT(al.id) as "activeCount"
        FROM "ApplicationLine" al
        JOIN "Application" a ON al."applicationId" = a.id
        JOIN "Plan" p ON a."planId" = p.id
        JOIN "Service" s ON p."serviceId" = s.id
        WHERE al.status = 'ACTIVATED'
        GROUP BY p.id, p.code, p.name, s.name
        ORDER BY "activeCount" DESC
      `,
    ]);

    const totalInStockSims = Number(overviewResult[0].in_stock);
    const totalActiveLines = Number(overviewResult[0].active);
    const totalReturningLines = Number(overviewResult[0].returned);

    // 用途タグ別SIM在庫（簡易実装: 全タグに総在庫数を表示）
    const simInventoryByUsageTag = usageTags.map((tag) => ({
      usageTagId: tag.id,
      usageTagCode: tag.code,
      usageTagName: tag.name,
      availableCount: totalInStockSims,
    }));

    // プラン別アクティブ回線（bigintをnumberに変換）
    const activeLinesByPlanFormatted = activeLinesByPlan.map((item) => ({
      ...item,
      activeCount: Number(item.activeCount),
    }));

    return NextResponse.json({
      overview: {
        totalInStockSims,
        totalActiveLines,
        totalReturningLines,
      },
      simInventoryByUsageTag,
      activeLinesByPlan: activeLinesByPlanFormatted,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "統計データの取得に失敗しました" },
      { status: 500 }
    );
  }
}
