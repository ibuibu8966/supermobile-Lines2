import useSWR from "swr";

export interface UsageTag {
  id: number;
  code: string;
  name: string;
}

export function useUsageTags() {
  const { data, error, isLoading, mutate } = useSWR<UsageTag[]>("/api/usage-tags");

  return {
    usageTags: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
