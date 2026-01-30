import useSWR from "swr";

interface UsageTag {
  id: number;
  code: string;
  name: string;
}

interface PlanUsageTag {
  usageTag: UsageTag;
}

export interface PlanPricing {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
  description: string | null;
}

interface Service {
  id: string;
  code: string;
  name: string;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  serviceId: string;
  service: Service;
  usageTags: PlanUsageTag[];
  pricings: PlanPricing[];
  _count: {
    applications: number;
  };
}

interface UsePlansOptions {
  includeInactive?: boolean;
  serviceId?: string;
}

export function usePlans(options: UsePlansOptions = {}) {
  const params = new URLSearchParams();
  if (options.includeInactive) params.set("includeInactive", "true");
  if (options.serviceId) params.set("serviceId", options.serviceId);

  const queryString = params.toString();
  const key = queryString ? `/api/plans?${queryString}` : "/api/plans";

  const { data, error, isLoading, mutate } = useSWR<Plan[]>(key);

  return {
    plans: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
