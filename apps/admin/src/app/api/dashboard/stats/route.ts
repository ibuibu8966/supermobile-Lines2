import { NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Overview counts
    const [totalInStockSims, totalActiveLines, totalReturningLines] = await Promise.all([
      prisma.sim.count({ where: { status: "IN_STOCK" } }),
      prisma.applicationLine.count({ where: { status: "ACTIVE" } }),
      prisma.applicationLine.count({ where: { status: "RETURNED" } }),
    ]);

    // SIM inventory by usage tag
    const usageTags = await prisma.usageTag.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    const simInventoryByUsageTag = await Promise.all(
      usageTags.map(async (tag) => {
        const availableCount = await prisma.sim.count({
          where: {
            status: "IN_STOCK",
            NOT: {
              consumedTagIds: { has: tag.id },
            },
          },
        });
        return {
          usageTagId: tag.id,
          usageTagCode: tag.code,
          usageTagName: tag.name,
          availableCount,
        };
      })
    );

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
      WHERE al.status = 'ACTIVE'
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
