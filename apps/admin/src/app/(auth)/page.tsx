import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { queryKeys, STALE_TIMES } from "@/lib/api/query-keys";
import { prisma } from "@/lib/database";

async function fetchDashboardStats() {
  const [overviewResult, usageTags, activeLinesByPlan] = await Promise.all([
    prisma.$queryRaw<Array<{ in_stock: bigint; active: bigint; returned: bigint }>>`
      SELECT
        (SELECT COUNT(*) FROM "Sim" WHERE status = 'IN_STOCK') as in_stock,
        (SELECT COUNT(*) FROM "ApplicationLine" WHERE status = 'ACTIVATED') as active,
        (SELECT COUNT(*) FROM "ApplicationLine" WHERE status = 'RETURNED') as returned
    `,
    prisma.usageTag.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
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

  const totalInStockSims = Number(overviewResult[0]?.in_stock ?? 0);
  const totalActiveLines = Number(overviewResult[0]?.active ?? 0);
  const totalReturningLines = Number(overviewResult[0]?.returned ?? 0);

  return {
    overview: { totalInStockSims, totalActiveLines, totalReturningLines },
    simInventoryByUsageTag: usageTags.map((tag) => ({
      usageTagId: tag.id,
      usageTagCode: tag.code,
      usageTagName: tag.name,
      availableCount: totalInStockSims,
    })),
    activeLinesByPlan: activeLinesByPlan.map((item) => ({
      ...item,
      activeCount: Number(item.activeCount),
    })),
  };
}

export default async function DashboardPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: fetchDashboardStats,
    staleTime: STALE_TIMES.STATS,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <DashboardStats />
      </HydrationBoundary>
    </div>
  );
}
