import { NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Overview counts
    const [totalInStockSims, totalActiveLines, totalReturningLines] = await Promise.all([
      prisma.sim.count({ where: { status: "IN_STOCK" } }),
      prisma.applicationLine.count({ where: { status: "ACTIVATED" } }),
      prisma.applicationLine.count({ where: { status: "RETURNED" } }),
    ]);

    // SIM inventory by usage tag（N+1回→2回のクエリ）
    const usageTags = await prisma.usageTag.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    // IN_STOCK SIMの消費済みタグごとのカウントを1回のクエリで取得
    const consumedCounts = await prisma.$queryRaw<
      Array<{ tagId: number; consumedCount: bigint }>
    >`
      SELECT unnest("consumedTagIds") as "tagId", COUNT(*) as "consumedCount"
      FROM "Sim"
      WHERE status = 'IN_STOCK'
      GROUP BY "tagId"
    `;

    const consumedCountMap = new Map<number, number>();
    for (const row of consumedCounts) {
      consumedCountMap.set(row.tagId, Number(row.consumedCount));
    }

    const simInventoryByUsageTag = usageTags.map((tag) => ({
      usageTagId: tag.id,
      usageTagCode: tag.code,
      usageTagName: tag.name,
      availableCount: totalInStockSims - (consumedCountMap.get(tag.id) || 0),
    }));

    // Active lines by plan
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

    // Convert BigInt to number for JSON serialization
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
