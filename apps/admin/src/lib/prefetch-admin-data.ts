import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./api/query-keys";
import { api } from "./api/client";

/**
 * 初回ページロード時にプリフェッチするマスターデータ
 * ・頻繁に変わらない参照系データのみ対象
 * ・ページネーション付きリスト(applications/lines/sims)は各ページで個別取得
 */
export async function prefetchAdminData(queryClient: QueryClient) {
  await Promise.allSettled([
    // マスターデータ（変更頻度低・全ページで共用）
    queryClient.prefetchQuery({
      queryKey: queryKeys.services,
      queryFn: api.getServices,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.plans,
      queryFn: api.getPlans,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.usageTags,
      queryFn: api.getUsageTags,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.simLocationTags,
      queryFn: api.getSimLocationTags,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.lineReserveTags,
      queryFn: api.getLineReserveTags,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.lineTags,
      queryFn: api.getLineTags,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.referrerTags,
      queryFn: api.getReferrerTags,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.suppliers,
      queryFn: api.getSuppliers,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.couponsWithRelations,
      queryFn: api.getCouponsWithRelations,
    }),
  ]);
}
