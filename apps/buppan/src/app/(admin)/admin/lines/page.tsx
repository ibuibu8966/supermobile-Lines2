"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@repo/ui";
import { Search, Loader2, ExternalLink, LogOut } from "lucide-react";

interface Line {
  id: string;
  lineNumber: number;
  status: string;
  shippedAt: string | null;
  returnedAt: string | null;
  contractMonth: string | null;
  application: {
    id: string;
    applicationNumber: string;
    customer: {
      type: string;
      name: string;
      phone: string;
    };
  };
  sim: {
    iccid: string;
    msisdn: string | null;
  } | null;
  lineTag: {
    id: number;
    name: string;
  } | null;
  lineReserveTag: {
    id: number;
    name: string;
  } | null;
}

interface LinesResponse {
  lines: Line[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  UNASSIGNED: "未割当",
  ASSIGNED: "割当済み",
  SHIPPED: "発送済み",
  ACTIVE: "利用中",
  CANCELLED: "解約済み",
  RETURNED: "返却済み",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "success" | "warning"> = {
  UNASSIGNED: "secondary",
  ASSIGNED: "default",
  SHIPPED: "default",
  ACTIVE: "success",
  CANCELLED: "destructive",
  RETURNED: "warning",
};

export default function LinesPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<LinesResponse["pagination"] | null>(null);

  const fetchLines = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", page.toString());

      const res = await fetch(`/api/admin/lines?${params}`);
      if (res.ok) {
        const data: LinesResponse = await res.json();
        setLines(data.lines);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("回線一覧取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLines();
  }, [statusFilter, page]);

  const handleSearch = () => {
    setPage(1);
    fetchLines();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ja-JP");
  };

  const formatMonth = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-primary">物販管理画面</h1>
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
              className="py-3 border-b-2 border-transparent text-sm text-muted-foreground hover:text-foreground"
            >
              申込管理
            </Link>
            <Link
              href="/admin/lines"
              className="py-3 border-b-2 border-primary text-sm font-medium"
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold">回線管理</h2>
          <p className="text-sm text-muted-foreground mt-1">
            物販サービスの回線を管理
          </p>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="relative">
            <input
              type="text"
              placeholder="顧客名/電話番号/ICCID..."
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              回線一覧
              {pagination && (
                <span className="text-sm font-normal text-gray-500">
                  {pagination.totalCount}件
                </span>
              )}
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && lines.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : lines.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                回線が見つかりません
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2 px-2">申込番号</th>
                      <th className="text-left py-2 px-2">顧客名</th>
                      <th className="text-left py-2 px-2">電話番号</th>
                      <th className="text-left py-2 px-2">ICCID</th>
                      <th className="text-left py-2 px-2">MSISDN</th>
                      <th className="text-left py-2 px-2">回線タグ</th>
                      <th className="text-left py-2 px-2">予備タグ</th>
                      <th className="text-left py-2 px-2">発送日</th>
                      <th className="text-left py-2 px-2">返却日</th>
                      <th className="text-left py-2 px-2">契約月</th>
                      <th className="text-left py-2 px-2">ステータス</th>
                      <th className="text-left py-2 px-2">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 font-mono text-xs">
                          {line.application.applicationNumber}
                        </td>
                        <td className="py-2 px-2">
                          {line.application.customer.name}
                        </td>
                        <td className="py-2 px-2 text-xs">
                          {line.application.customer.phone}
                        </td>
                        <td className="py-2 px-2 font-mono text-xs">
                          {line.sim?.iccid || "—"}
                        </td>
                        <td className="py-2 px-2 text-xs">
                          {line.sim?.msisdn || "—"}
                        </td>
                        <td className="py-2 px-2">
                          {line.lineTag ? (
                            <Badge variant="outline">{line.lineTag.name}</Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 px-2">
                          {line.lineReserveTag ? (
                            <Badge variant="outline">{line.lineReserveTag.name}</Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 px-2 text-xs">
                          {formatDate(line.shippedAt)}
                        </td>
                        <td className="py-2 px-2 text-xs">
                          {formatDate(line.returnedAt)}
                        </td>
                        <td className="py-2 px-2 text-xs">
                          {formatMonth(line.contractMonth)}
                        </td>
                        <td className="py-2 px-2">
                          <Badge variant={STATUS_VARIANTS[line.status] || "secondary"}>
                            {STATUS_LABELS[line.status] || line.status}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">
                          <Link
                            href={`/admin/applications/${line.application.id}`}
                            className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                          >
                            <ExternalLink className="h-3 w-3" />
                            申込詳細
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
