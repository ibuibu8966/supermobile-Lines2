import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES } from "@/lib/api/query-keys";
import { prisma } from "@/lib/database";
import { getAdminSession } from "@/lib/auth/admin-session";
import { ApplicationService } from "@/services/application.service";
import { ApplicationRepository } from "@/repositories/application.repository";
import { ServiceService } from "@/services/service.service";
import { ServiceRepository } from "@/repositories/service.repository";
import { SimRepository } from "@/repositories/sim.repository";
import { ApplicationsClient } from "./applications-client";

export default async function ApplicationsPage() {
  const queryClient = new QueryClient();

  try {
    // サーバーサイドで認証チェック
    const sessionResult = await getAdminSession();
    if (!(sessionResult instanceof Response)) {
      const session = sessionResult;
      const applicationService = new ApplicationService(
        new ApplicationRepository(prisma)
      );
      const serviceService = new ServiceService(new ServiceRepository(prisma));
      const simRepo = new SimRepository(prisma);

      await Promise.all([
        // デフォルト状態（フィルターなし、1ページ目）をプリフェッチ
        queryClient.prefetchQuery({
          queryKey: queryKeys.applications(undefined),
          queryFn: () =>
            applicationService
              .getApplicationList(
                {},
                { page: 1, pageSize: 50, skip: 0 },
                session
              )
              .then((result) => ({
                data: result.applications,
                pagination: {
                  page: result.pagination.currentPage,
                  pageSize: result.pagination.limit,
                  total: result.pagination.totalCount,
                  totalPages: result.pagination.totalPages,
                },
              })),
          staleTime: STALE_TIMES.LIST,
        }),
        // サービス一覧（フィルター用マスターデータ）
        queryClient.prefetchQuery({
          queryKey: queryKeys.services,
          queryFn: () => serviceService.getServiceList({}),
          staleTime: STALE_TIMES.MASTER,
        }),
        // IN_STOCK ICCID一覧（ICCID連続入力モーダル用・ページ読み込み時に1回取得）
        queryClient.prefetchQuery({
          queryKey: queryKeys.inStockIccids,
          queryFn: () => simRepo.findInStockIccids().then((iccids) => ({ iccids })),
          staleTime: 60_000,
        }),
      ]);
    }
  } catch {
    // プリフェッチ失敗時はクライアント側でフォールバック取得
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApplicationsClient />
    </HydrationBoundary>
  );
}
