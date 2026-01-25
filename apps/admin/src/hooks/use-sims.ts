import useSWR from "swr";

interface UsageTag {
  id: number;
  code: string;
  name: string;
}

interface SimLocationTag {
  id: number;
  code: string;
  name: string;
}

interface Contract {
  id: string;
  serviceName: string;
  contractStart: string | null;
  contractEnd: string | null;
  status: string;
  customer: {
    id: string;
    lastName: string;
    firstName: string;
    companyName: string | null;
    type: string;
  } | null;
  usageTags: Array<{
    usageTag: UsageTag;
  }>;
}

export interface Sim {
  iccid: string;
  msisdn: string | null;
  simType: string;
  carrierType: string | null;
  status: string;
  isMnpEligible: boolean;
  supplier: {
    id: number;
    code: string;
    name: string;
  };
  simLocationTag: SimLocationTag | null;
  simLocationTagId: number | null;
  contracts: Contract[];
  consumedTags: UsageTag[];
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface SimsResponse {
  data: Sim[];
  pagination: PaginationInfo;
}

interface UseSimsOptions {
  search?: string;
  status?: string;
  carrier?: string;
  simLocationTagId?: string;
  page?: number;
}

export function useSims(options: UseSimsOptions = {}) {
  const params = new URLSearchParams();
  if (options.search) params.set("search", options.search);
  if (options.status) params.set("status", options.status);
  if (options.carrier) params.set("carrier", options.carrier);
  if (options.simLocationTagId) params.set("simLocationTagId", options.simLocationTagId);
  params.set("page", (options.page || 1).toString());

  const { data, error, isLoading, isValidating, mutate } = useSWR<SimsResponse>(
    `/api/sims?${params.toString()}`
  );

  return {
    sims: data?.data || [],
    pagination: data?.pagination || null,
    isLoading,
    isValidating,
    error,
    mutate,
  };
}

export function useSimLocationTags() {
  const { data, error, isLoading } = useSWR<SimLocationTag[]>("/api/sim-location-tags");

  return {
    simLocationTags: data || [],
    isLoading,
    error,
  };
}
