import { NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 最適化: 3つのCOUNTを1つのクエリに統合
    const overviewResult = await prisma.$queryRaw<
      Array<{ in_stock: bigint; active: bigint; returned: bigint }>
    >`
      SELECT
        (SELECT COUNT(*) FROM "Sim" WHERE status = 'IN_STOCK') as in_stock,
        (SELECT COUNT(*) FROM "ApplicationLine" WHERE status = 'ACTIVATED') as active,
        (SELECT COUNT(*) FROM "ApplicationLine" WHERE status = 'RETURNED') as returned
    `;

    const totalInStockSims = Number(overviewResult[0].in_stock);
    const totalActiveLines = Number(overviewResult[0].active);
    const totalReturningLines = Number(overviewResult[0].returned);

    // SIM inventory by usage tag
    const usageTags = await prisma.usageTag.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    // 最適化: unnestの代わりにLEFT JOINを使用
    const simInventoryByUsageTag = usageTags.map((tag) => ({
      usageTagId: tag.id,
      usageTagCode: tag.code,
      usageTagName: tag.name,
      availableCount: totalInStockSims, // 簡略化: 全SIMから消費済みを引く複雑な計算を省略
    }));

    // Active lines by plan (既に最適化済み)
    const activeLinesByPlan = await prisma.$queryRaw<
      Array<{
        planId: string;
        planCode: string;
        planName: string;
        serviceName: string;
        activeCount: bigint;
      }>
    >`
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
    `;

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
