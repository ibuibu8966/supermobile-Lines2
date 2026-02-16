/**
 * Customer dashboard entity
 */

export interface CustomerDashboardLineStats {
  active: number;
  pending: number;
  cancelled: number;
}

export interface CustomerDashboardApplication {
  id: string;
  applicationNumber: string;
  status: string;
  quantity: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  plan: {
    id: string;
    name: string;
    unitPrice: number;
  };
  lines: Array<{
    id: string;
    phoneNumber: string | null;
    status: string;
  }>;
}

export interface CustomerDashboardResult {
  customer: {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
  } | null;
  applications: CustomerDashboardApplication[];
  lineStats: CustomerDashboardLineStats;
}
