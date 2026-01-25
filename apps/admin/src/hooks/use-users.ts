import useSWR from "swr";

interface Service {
  id: string;
  code: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
  serviceId: string | null;
  service: Service | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    customers: number;
  };
}

interface UseUsersOptions {
  includeInactive?: boolean;
  role?: string;
  serviceId?: string;
}

export function useUsers(options: UseUsersOptions = {}) {
  const params = new URLSearchParams();
  if (options.includeInactive) params.set("includeInactive", "true");
  if (options.role) params.set("role", options.role);
  if (options.serviceId) params.set("serviceId", options.serviceId);

  const { data, error, isLoading, isValidating, mutate } = useSWR<User[]>(
    `/api/users?${params.toString()}`
  );

  return {
    users: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}

export function useServices() {
  const { data, error, isLoading } = useSWR<Service[]>("/api/services");

  return {
    services: data || [],
    isLoading,
    error,
  };
}
