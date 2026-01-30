import useSWR from "swr";

export interface DashboardStats {
  overview: {
    totalInStockSims: number;
    totalActiveLines: number;
    totalReturningLines: number;
  };
  simInventoryByUsageTag: Array<{
    usageTagId: number;
    usageTagCode: string;
    usageTagName: string;
    availableCount: number;
  }>;
  activeLinesByPlan: Array<{
    planId: string;
    planCode: string;
    planName: string;
    serviceName: string;
    activeCount: number;
  }>;
}

export function useDashboardStats() {
  const { data, error, isLoading } = useSWR<DashboardStats>("/api/dashboard/stats");

  return {
    stats: data ?? null,
    error,
    isLoading,
  };
}
