import useSWR from "swr";

export interface Service {
  id: string;
  code: string;
  name: string;
}

interface UseServicesOptions {
  includeInactive?: boolean;
}

export function useServices(options: UseServicesOptions = {}) {
  const params = new URLSearchParams();
  if (options.includeInactive) params.set("includeInactive", "true");

  const queryString = params.toString();
  const key = queryString ? `/api/services?${queryString}` : "/api/services";

  const { data, error, isLoading, mutate } = useSWR<Service[]>(key);

  return {
    services: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
