"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

// Types
interface DashboardStats {
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

interface Service {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  _count?: {
    plans: number;
    applications: number;
    users: number;
  };
  plans?: any[];
}

interface Plan {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  serviceId: string;
  service: { id: string; code: string; name: string };
  usageTags: Array<{ usageTag: { id: number; code: string; name: string } }>;
  pricings: Array<{
    id: string;
    minQuantity: number;
    maxQuantity: number | null;
    unitPrice: number;
    description: string | null;
  }>;
  _count: { applications: number };
}

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

interface LineReserveTag {
  id: number;
  code: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  serviceId: string | null;
  service: { id: string; name: string } | null;
}

interface PaginatedData<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface AdminData {
  dashboardStats: DashboardStats | null;
  services: Service[];
  plans: Plan[];
  usageTags: UsageTag[];
  simLocationTags: SimLocationTag[];
  lineReserveTags: LineReserveTag[];
  users: User[];
  lines: PaginatedData<any> | null;
  applications: PaginatedData<any> | null;
  sims: PaginatedData<any> | null;
}

interface AdminDataContextType {
  data: AdminData;
  setData: <K extends keyof AdminData>(key: K, value: AdminData[K]) => void;
  isLoaded: boolean;
  loadAllData: () => Promise<void>;
  refetch: (key: keyof AdminData) => Promise<void>;
}

const initialData: AdminData = {
  dashboardStats: null,
  services: [],
  plans: [],
  usageTags: [],
  simLocationTags: [],
  lineReserveTags: [],
  users: [],
  lines: null,
  applications: null,
  sims: null,
};

const AdminDataContext = createContext<AdminDataContextType | null>(null);

const ENDPOINTS: Record<keyof AdminData, string> = {
  dashboardStats: "/api/dashboard/stats",
  services: "/api/services",
  plans: "/api/plans",
  usageTags: "/api/usage-tags",
  simLocationTags: "/api/sim-location-tags",
  lineReserveTags: "/api/line-reserve-tags",
  users: "/api/users",
  lines: "/api/lines?page=1",
  applications: "/api/applications?page=1",
  sims: "/api/sims?page=1",
};

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AdminData>(initialData);
  const [isLoaded, setIsLoaded] = useState(false);

  const setData = useCallback(<K extends keyof AdminData>(key: K, value: AdminData[K]) => {
    setDataState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const refetch = useCallback(async (key: keyof AdminData) => {
    try {
      const res = await fetch(ENDPOINTS[key]);
      if (res.ok) {
        const fetchedData = await res.json();
        setDataState((prev) => ({ ...prev, [key]: fetchedData }));
      }
    } catch (err) {
      console.error(`Failed to refetch ${key}:`, err);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    const results = await Promise.allSettled(
      Object.entries(ENDPOINTS).map(async ([key, url]) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}`);
        const fetchedData = await res.json();
        return { key, data: fetchedData };
      })
    );

    const newData = { ...initialData };
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        (newData as any)[result.value.key] = result.value.data;
      }
    });

    setDataState(newData);
    setIsLoaded(true);
  }, []);

  return (
    <AdminDataContext.Provider value={{ data, setData, isLoaded, loadAllData, refetch }}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error("useAdminData must be used within AdminDataProvider");
  }
  return context;
}
