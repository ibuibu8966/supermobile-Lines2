"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, ExternalLink, LogOut } from "lucide-react";

interface Application {
  id: string;
  applicationNumber: string;
  status: string;
  lineCount: number;
  totalAmount: number;
  createdAt: string;
  customer: {
    id: string;
    type: string;
    name: string;
    email: string;
    phone: string;
  };
  plan: {
    id: string;
    name: string;
  };
}

interface ApplicationsResponse {
  applications: Application[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "申込済み",
  PAYMENT_PENDING: "入金待ち",
  PAID: "入金済み",
  SHIPPING: "発送中",
  COMPLETED: "完了",
  CANCELLED: "キャンセル",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  SUBMITTED: "secondary",
  PAYMENT_PENDING: "warning",
  PAID: "success",
  SHIPPING: "default",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ApplicationsResponse["pagination"] | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (customerTypeFilter) params.set("customerType", customerTypeFilter);
      params.set("page", page.toString());
      params.set("excludeArchived", "true");

      const res = await fetch(`/api/admin/applications?${params}`);
      if (res.ok) {
        const data: ApplicationsResponse = await res.json();
        setApplications(data.applications);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("申込一覧取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, customerTypeFilter, page]);

  const handleSearch = () => {
    setPage(1);
    fetchApplications();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-primary">versus管理画面</h1>
            <Badge variant="secondary">ADMIN</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">管理者</span>
            <Button variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            <Link
              href="/admin"
              className="py-3 border-b-2 border-transparent text-sm text-muted-foreground hover:text-foreground"
            >
              ダッシュボード
            </Link>
            <Link
              href="/admin/applications"
              className="py-3 border-b-2 border-primary text-sm font-medium"
            >
              申込管理
            </Link>
            <Link
              href="/admin/lines"
              className="py-3 border-b-2 border-transparent text-sm text-muted-foreground hover:text-foreground"
            >
              回線管理
            </Link>
            <Link
              href="/admin/kyc"
              className="py-3 border-b-2 border-transparent text-sm text-muted-foreground hover:text-foreground"
            >
              KYC確認
            </Link>
            <Link
              href="/admin/shipping"
              className="py-3 border-b-2 border-transparent text-sm text-muted-foreground hover:text-foreground"
            >
              発送管理
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">申込管理</h2>
            <p className="text-sm text-muted-foreground mt-1">
              アクティブな申込を管理
            </p>
          </div>
          <Link href="/admin/applications/archived">
            <Button variant="outline">アーカイブ済み</Button>
          </Link>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="relative">
            <input
              type="text"
              placeholder="申込番号/名前/メール/電話..."
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
            {Object.entries(STATUS_LABELS)
              .filter(([key]) => !["COMPLETED", "CANCELLED"].includes(key))
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              申込一覧
              {pagination && (
                <span className="text-sm font-normal text-gray-500">
                  {pagination.totalCount}件
                </span>
              )}
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && applications.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                申込が見つかりません
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2 px-2 whitespace-nowrap min-w-[100px]">申込番号</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap min-w-[70px]">区分</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap min-w-[120px]">顧客名</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap min-w-[110px]">電話番号</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap min-w-[100px]">プラン</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap min-w-[50px]">回線数</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap min-w-[80px]">金額</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap min-w-[90px]">ステータス</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap min-w-[90px]">申込日</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap min-w-[60px]">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 font-mono text-xs">
                          {app.applicationNumber}
                        </td>
                        <td className="py-2 px-2">
                          <Badge
                            variant={
                              app.customer.type === "CORPORATE"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {app.customer.type === "CORPORATE" ? "法人" : "個人"}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">{app.customer.name}</td>
                        <td className="py-2 px-2 text-xs">{app.customer.phone}</td>
                        <td className="py-2 px-2">{app.plan.name}</td>
                        <td className="py-2 px-2 text-center">{app.lineCount}</td>
                        <td className="py-2 px-2">
                          {app.totalAmount.toLocaleString()}円
                        </td>
                        <td className="py-2 px-2">
                          <Badge variant={STATUS_VARIANTS[app.status] || "secondary"}>
                            {STATUS_LABELS[app.status] || app.status}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-xs">
                          {formatDate(app.createdAt)}
                        </td>
                        <td className="py-2 px-2">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                          >
                            <ExternalLink className="h-3 w-3" />
                            詳細
                          </Link>
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
                  {pagination.totalCount}件中{" "}
                  {(pagination.page - 1) * pagination.pageSize + 1}-
                  {Math.min(
                    pagination.page * pagination.pageSize,
                    pagination.totalCount
                  )}
                  件を表示
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    前へ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
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
