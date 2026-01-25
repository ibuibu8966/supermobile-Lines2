import useSWR from "swr";

interface Customer {
  id: string;
  type: string;
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  companyName: string | null;
  companyNameKana: string | null;
  email: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  address: string;
  building: string | null;
  companyPostalCode: string | null;
  companyPrefecture: string | null;
  companyCity: string | null;
  companyAddress: string | null;
  companyBuilding: string | null;
}

interface Service {
  id: string;
  code: string;
  name: string;
}

interface Plan {
  id: string;
  code: string;
  name: string;
}

interface KycImage {
  id: string;
  type: string;
  storagePath: string;
  status: string;
  expiryDate: string | null;
}

export interface Application {
  id: string;
  applicationNumber: string;
  status: string;
  lineCount: number;
  unitPrice: number;
  totalAmount: number;
  comment1: string | null;
  comment2: string | null;
  createdAt: string;
  customer: Customer;
  service: Service;
  plan: Plan;
  kycImages: KycImage[];
  stats: {
    lineCount: number;
    shippedCount: number;
    unassignedCount: number;
    returnedCount: number;
  };
  latestExpiryDate: string | null;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ApplicationsResponse {
  data: Application[];
  pagination: PaginationInfo;
}

interface UseApplicationsOptions {
  search?: string;
  status?: string;
  serviceId?: string;
  customerType?: string;
  page?: number;
}

export function useApplications(options: UseApplicationsOptions = {}) {
  const params = new URLSearchParams();
  if (options.search) params.set("search", options.search);
  if (options.status) params.set("status", options.status);
  if (options.serviceId) params.set("serviceId", options.serviceId);
  if (options.customerType) params.set("customerType", options.customerType);
  params.set("page", (options.page || 1).toString());

  const { data, error, isLoading, isValidating, mutate } = useSWR<ApplicationsResponse>(
    `/api/applications?${params.toString()}`
  );

  return {
    applications: data?.data || [],
    pagination: data?.pagination || null,
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
