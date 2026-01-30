import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import { api } from "./api";

export async function prefetchAdminData(queryClient: QueryClient) {
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboardStats,
      queryFn: api.getDashboardStats,
    }),
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
      queryKey: queryKeys.users,
      queryFn: api.getUsers,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.rules,
      queryFn: api.getRules,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.suppliers,
      queryFn: api.getSuppliers,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.sims(),
      queryFn: () => api.getSims(),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.applications(),
      queryFn: () => api.getApplications(),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.lines(),
      queryFn: () => api.getLines(),
    }),
  ]);
}
