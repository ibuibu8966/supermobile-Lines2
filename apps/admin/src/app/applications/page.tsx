"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { ArrowLeft, Search, Loader2, ExternalLink } from "lucide-react";

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

interface Application {
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

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "申込済み",
  KYC_PENDING: "本人確認待ち",
  KYC_APPROVED: "本人確認OK",
  KYC_REJECTED: "本人確認NG",
  PAYMENT_PENDING: "入金待ち",
  PAID: "入金済み",
  SHIPPING: "発送中",
  COMPLETED: "完了",
  CANCELLED: "キャンセル",
};

const STATUS_VARIANTS: Record<string, "default" | "success" | "destructive" | "secondary" | "outline"> = {
  SUBMITTED: "default",
  KYC_PENDING: "secondary",
  KYC_APPROVED: "success",
  KYC_REJECTED: "destructive",
  PAYMENT_PENDING: "secondary",
  PAID: "success",
  SHIPPING: "default",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

const KYC_VERIFY_OPTIONS = [
  { value: "", label: "未確認" },
  { value: "KYC_APPROVED", label: "OK" },
  { value: "KYC_REJECTED", label: "NG" },
];

const PAYMENT_VERIFY_OPTIONS = [
  { value: "", label: "未確認" },
  { value: "PAID", label: "入金済み" },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);

  // フィルタ
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  // サービス一覧取得
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch("/api/services");
        if (res.ok) {
          const data = await res.json();
          setServices(data);
        }
      } catch (error) {
        console.error("サービス取得エラー:", error);
      }
    };
    fetchServices();
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (serviceFilter) params.set("serviceId", serviceFilter);
      if (customerTypeFilter) params.set("customerType", customerTypeFilter);
      params.set("page", page.toString());

      const res = await fetch(`/api/applications?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setApplications(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("申し込み取得エラー:", error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, serviceFilter, customerTypeFilter, page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleSearch = () => {
    setPage(1);
    fetchApplications();
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchApplications();
      }
    } catch (error) {
      console.error("ステータス更新エラー:", error);
    }
  };

  const updateApplicationComment = async (id: string, field: "comment1" | "comment2", value: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        fetchApplications();
      }
    } catch (error) {
      console.error("コメント更新エラー:", error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ja-JP");
  };

  const getCustomerName = (customer: Customer) => {
    if (customer.type === "CORPORATE" && customer.companyName) {
      return customer.companyName;
    }
    return `${customer.lastName} ${customer.firstName}`;
  };

  const getCustomerNameKana = (customer: Customer) => {
    if (customer.type === "CORPORATE" && customer.companyNameKana) {
      return customer.companyNameKana;
    }
    return `${customer.lastNameKana} ${customer.firstNameKana}`;
  };

  const getKycVerifyStatus = (status: string) => {
    if (status === "KYC_APPROVED") return "KYC_APPROVED";
    if (status === "KYC_REJECTED") return "KYC_REJECTED";
    return "";
  };

  const getPaymentVerifyStatus = (status: string) => {
    if (["PAID", "SHIPPING", "COMPLETED"].includes(status)) return "PAID";
    return "";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">申し込み一覧</h1>
              <p className="text-sm text-gray-500 mt-1">
                全サービスの申し込みを一元管理
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="relative">
              <input
                type="text"
                placeholder="申込番号/名前/会社名/メール/電話..."
                className="px-4 py-2 border rounded-md w-72 pr-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
            <select
              className="px-4 py-2 border rounded-md"
              value={serviceFilter}
              onChange={(e) => {
                setServiceFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">サービス</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-2 border rounded-md"
              value={customerTypeFilter}
              onChange={(e) => {
                setCustomerTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">顧客区分</option>
              <option value="INDIVIDUAL">個人</option>
              <option value="CORPORATE">法人</option>
            </select>
            <select
              className="px-4 py-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">ステータス</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              申し込み一覧
              {pagination && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  {pagination.total}件
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                申し込みが見つかりません
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2 px-2 whitespace-nowrap">詳細</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">個人/法人</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">名前/会社名</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">カナ</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">電話番号</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">メール</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">サービス</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">回線数</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">発送</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">未発行</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">返却</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">画像</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">有効期限</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">本人確認</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">決済確認</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">コメント1</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">コメント2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">
                          <Link
                            href={`/applications/${app.id}`}
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            詳細
                          </Link>
                        </td>
                        <td className="py-2 px-2">
                          <Badge variant={app.customer.type === "CORPORATE" ? "default" : "secondary"}>
                            {app.customer.type === "CORPORATE" ? "法人" : "個人"}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          {getCustomerName(app.customer)}
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap text-xs text-gray-500">
                          {getCustomerNameKana(app.customer)}
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap text-xs">
                          {app.customer.phone}
                        </td>
                        <td className="py-2 px-2 text-xs">
                          <a href={`mailto:${app.customer.email}`} className="text-blue-600 hover:underline">
                            {app.customer.email}
                          </a>
                        </td>
                        <td className="py-2 px-2">
                          <Badge variant="outline">{app.service.name}</Badge>
                        </td>
                        <td className="py-2 px-2 text-center">{app.stats.lineCount}</td>
                        <td className="py-2 px-2 text-center">{app.stats.shippedCount}</td>
                        <td className="py-2 px-2 text-center">{app.stats.unassignedCount}</td>
                        <td className="py-2 px-2 text-center">{app.stats.returnedCount}</td>
                        <td className="py-2 px-2">
                          {app.kycImages.length > 0 ? (
                            <Link
                              href={`/applications/${app.id}#kyc`}
                              className="text-blue-600 hover:underline text-xs"
                            >
                              {app.kycImages.length}件
                            </Link>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-xs whitespace-nowrap">
                          {formatDate(app.latestExpiryDate)}
                        </td>
                        <td className="py-2 px-2">
                          <select
                            className="px-2 py-1 border rounded text-xs"
                            value={getKycVerifyStatus(app.status)}
                            onChange={(e) => {
                              if (e.target.value) {
                                updateApplicationStatus(app.id, e.target.value);
                              }
                            }}
                          >
                            {KYC_VERIFY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            className="px-2 py-1 border rounded text-xs"
                            value={getPaymentVerifyStatus(app.status)}
                            onChange={(e) => {
                              if (e.target.value) {
                                updateApplicationStatus(app.id, e.target.value);
                              }
                            }}
                          >
                            {PAYMENT_VERIFY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            className="px-2 py-1 border rounded text-xs w-24"
                            defaultValue={app.comment1 || ""}
                            onBlur={(e) => {
                              if (e.target.value !== (app.comment1 || "")) {
                                updateApplicationComment(app.id, "comment1", e.target.value);
                              }
                            }}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            className="px-2 py-1 border rounded text-xs w-24"
                            defaultValue={app.comment2 || ""}
                            onBlur={(e) => {
                              if (e.target.value !== (app.comment2 || "")) {
                                updateApplicationComment(app.id, "comment2", e.target.value);
                              }
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                <span>
                  {pagination.total}件中{" "}
                  {(pagination.page - 1) * pagination.pageSize + 1}-
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                  件を表示
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    前へ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    次へ
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
