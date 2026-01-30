"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui";
import { Plus, Upload, ChevronDown, ChevronRight, Search, Loader2, AlertCircle, Smartphone, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryState } from "nuqs";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api";
import { SupplierManager } from "@/components/suppliers/supplier-manager";

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
    usageTag: {
      id: number;
      code: string;
      name: string;
    };
  }>;
}

interface Sim {
  iccid: string;
  msisdn: string | null;
  simType: string;
  carrierType: string | null;
  status: string;
  isMnpEligible: boolean;
  supplier: {
    id: string;
    code: string;
    name: string;
  };
  simLocationTag: {
    id: number;
    code: string;
    name: string;
  } | null;
  simLocationTagId: number | null;
  contracts: Contract[];
  consumedTags: Array<{
    id: number;
    code: string;
    name: string;
  }>;
}

interface SimsResponse {
  data: Sim[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  IN_STOCK: "在庫",
  ACTIVE: "利用中",
  RETURNING: "返却中",
  RETIRED: "廃止",
  CANCELLED: "解約済",
};

const STATUS_VARIANTS: Record<string, "default" | "success" | "destructive" | "secondary" | "outline"> = {
  IN_STOCK: "default",
  ACTIVE: "success",
  RETURNING: "secondary",
  RETIRED: "destructive",
  CANCELLED: "destructive",
};

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  PENDING: "準備中",
  SHIPPED: "発送済",
  ACTIVE: "利用中",
  ENDED: "終了",
  CANCELLED: "解約",
};

const CARRIER_LABELS: Record<string, string> = {
  DOCOMO: "docomo",
  AU: "au",
  SOFTBANK: "SoftBank",
  RAKUTEN: "楽天",
};

export function SimsClient() {
  const queryClient = useQueryClient();

  // simLocationTags from cache (prefetched at login)
  const { data: simLocationTags = [] } = useQuery<{ id: number; code?: string; name: string }[]>({
    queryKey: queryKeys.simLocationTags,
    queryFn: api.getSimLocationTags,
  });

  // URL状態管理
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [statusFilter, setStatusFilter] = useQueryState("status", { defaultValue: "" });
  const [carrierFilter, setCarrierFilter] = useQueryState("carrier", { defaultValue: "" });
  const [simLocationFilter, setSimLocationFilter] = useQueryState("simLocation", { defaultValue: "" });
  const [page, setPage] = useQueryState("page", {
    defaultValue: "1",
    parse: (v) => v,
    serialize: (v) => v,
  });

  // ローカル状態
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState(search);

  // フィルターが設定されているかチェック
  const hasFilters = !!(search || statusFilter || carrierFilter || simLocationFilter || page !== "1");

  // クエリパラメータ生成
  const queryParams = useMemo(() => {
    if (!hasFilters) return undefined;
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (carrierFilter) params.carrier = carrierFilter;
    if (simLocationFilter) params.simLocationTagId = simLocationFilter;
    params.page = page;
    return params;
  }, [hasFilters, search, statusFilter, carrierFilter, simLocationFilter, page]);

  // SIMs data from cache (prefetched at login for default view)
  const { data: simsData, isFetching: isLoadingSims, error } = useQuery<SimsResponse>({
    queryKey: queryKeys.sims(queryParams),
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (carrierFilter) params.set("carrier", carrierFilter);
      if (simLocationFilter) params.set("simLocationTagId", simLocationFilter);
      params.set("page", page);
      return api.getSims(params);
    },
  });

  const sims = simsData?.data || [];
  const pagination = simsData?.pagination || null;

  const toggleExpand = (iccid: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(iccid)) {
        next.delete(iccid);
      } else {
        next.add(iccid);
      }
      return next;
    });
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage("1");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ja-JP");
  };

  const getCustomerName = (contract: Contract) => {
    if (!contract.customer) return "—";
    if (contract.customer.type === "CORPORATE" && contract.customer.companyName) {
      return contract.customer.companyName;
    }
    return `${contract.customer.lastName} ${contract.customer.firstName}`;
  };

  const updateSimLocationTag = async (iccid: string, simLocationTagId: number | null) => {
    if (!simsData) return;

    // 楽観的更新
    const foundTag = simLocationTagId ? simLocationTags.find(t => t.id === simLocationTagId) : null;
    const currentQueryKey = queryKeys.sims(queryParams);

    queryClient.setQueryData<SimsResponse>(currentQueryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((sim) =>
          sim.iccid === iccid
            ? {
                ...sim,
                simLocationTagId,
                simLocationTag: foundTag ? { id: foundTag.id, code: foundTag.code || "", name: foundTag.name } : null
              }
            : sim
        ),
      };
    });

    try {
      const res = await fetch(`/api/sims/${iccid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simLocationTagId }),
      });
      if (res.ok) {
        toast.success("SIMの場所を更新しました");
      } else {
        throw new Error("更新に失敗しました");
      }
    } catch {
      toast.error("SIMの場所の更新に失敗しました");
      queryClient.invalidateQueries({ queryKey: currentQueryKey });
    }
  };

  // Tab state
  const [activeTab, setActiveTab] = useQueryState("view", { defaultValue: "sims" });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SIM管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          SIMカードと仕入れ先の管理
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Pill tabs */}
        <TabsList className="inline-flex h-10 items-center justify-center rounded-full bg-muted p-1 mb-6">
          <TabsTrigger
            value="sims"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            SIM一覧
          </TabsTrigger>
          <TabsTrigger
            value="suppliers"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Building2 className="h-4 w-4 mr-2" />
            仕入れ先
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sims" className="mt-0">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm flex items-center gap-2 mb-4">
              <AlertCircle className="h-4 w-4" />
              データの取得に失敗しました。再度お試しください。
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ICCID / 電話番号で検索..."
                  className="px-4 py-2 border rounded-md w-64 pr-10"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
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
                value={carrierFilter}
                onChange={(e) => {
                  setCarrierFilter(e.target.value);
                  setPage("1");
                }}
              >
                <option value="">キャリア</option>
                <option value="DOCOMO">docomo</option>
                <option value="AU">au</option>
                <option value="SOFTBANK">SoftBank</option>
                <option value="RAKUTEN">楽天</option>
              </select>
              <select
                className="px-4 py-2 border rounded-md"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage("1");
                }}
              >
                <option value="">ステータス</option>
                <option value="IN_STOCK">在庫</option>
                <option value="ACTIVE">利用中</option>
                <option value="RETURNING">返却中</option>
                <option value="RETIRED">廃止</option>
              </select>
              <select
                className="px-4 py-2 border rounded-md"
                value={simLocationFilter}
                onChange={(e) => {
                  setSimLocationFilter(e.target.value);
                  setPage("1");
                }}
              >
                <option value="">SIMの場所</option>
                {simLocationTags.map((tag) => (
                  <option key={tag.id} value={tag.id.toString()}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Link href="/sims/import">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  CSVインポート
                </Button>
              </Link>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新規登録
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                SIM一覧（親子表示）
                {pagination && (
                  <span className="text-sm font-normal text-gray-500">
                    {pagination.total}件
                  </span>
                )}
                {isLoadingSims && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sims.length === 0 && !isLoadingSims ? (
                <div className="text-center py-12 text-gray-500">
                  SIMが見つかりません
                </div>
              ) : sims.length === 0 && isLoadingSims ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 w-8"></th>
                        <th className="text-left py-3 px-4">ICCID</th>
                        <th className="text-left py-3 px-4">電話番号</th>
                        <th className="text-left py-3 px-4">キャリア</th>
                        <th className="text-left py-3 px-4">MNP</th>
                        <th className="text-left py-3 px-4">消費済みタグ</th>
                        <th className="text-left py-3 px-4">SIMの場所</th>
                        <th className="text-left py-3 px-4">ステータス</th>
                        <th className="text-left py-3 px-4">仕入れ先</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sims.map((sim) => (
                        <>
                          <tr key={sim.iccid} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              {sim.contracts.length > 0 && (
                                <button
                                  onClick={() => toggleExpand(sim.iccid)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  {expandedRows.has(sim.iccid) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs">
                              <Link href={`/sims/${sim.iccid}`} className="hover:underline text-blue-600">
                                {sim.iccid}
                              </Link>
                            </td>
                            <td className="py-3 px-4">
                              {sim.msisdn || "—"}
                            </td>
                            <td className="py-3 px-4">
                              {sim.carrierType ? (
                                <Badge variant="outline">
                                  {CARRIER_LABELS[sim.carrierType] || sim.carrierType}
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={sim.isMnpEligible ? "success" : "destructive"}>
                                {sim.isMnpEligible ? "可" : "不可"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1 flex-wrap">
                                {sim.consumedTags.length > 0 ? (
                                  sim.consumedTags.map((tag) => (
                                    <Badge key={tag.id} variant="secondary">
                                      {tag.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                className="px-2 py-1 border rounded text-sm min-w-[100px]"
                                value={sim.simLocationTagId?.toString() || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  updateSimLocationTag(
                                    sim.iccid,
                                    value ? parseInt(value) : null
                                  );
                                }}
                              >
                                <option value="">未設定</option>
                                {simLocationTags.map((tag) => (
                                  <option key={tag.id} value={tag.id.toString()}>
                                    {tag.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={STATUS_VARIANTS[sim.status] || "default"}>
                                {STATUS_LABELS[sim.status] || sim.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">{sim.supplier.name}</td>
                          </tr>
                          {expandedRows.has(sim.iccid) &&
                            sim.contracts.map((contract: Contract) => (
                              <tr
                                key={contract.id}
                                className="bg-gray-50/50 border-b"
                              >
                                <td className="py-2 px-4"></td>
                                <td colSpan={8} className="py-2 px-4">
                                  <div className="pl-4 border-l-2 border-gray-300 ml-2">
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                      <span>
                                        {formatDate(contract.contractStart)}〜
                                        {contract.contractEnd
                                          ? formatDate(contract.contractEnd)
                                          : "現在"}
                                      </span>
                                      <span>{getCustomerName(contract)}</span>
                                      <Badge variant="outline">
                                        {contract.serviceName}
                                      </Badge>
                                      {contract.usageTags.map((ut) => (
                                        <Badge key={ut.usageTag.id} variant="secondary">
                                          {ut.usageTag.name}
                                        </Badge>
                                      ))}
                                      <Badge>
                                        {CONTRACT_STATUS_LABELS[contract.status] ||
                                          contract.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </>
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
                      onClick={() => setPage((parseInt(page) - 1).toString())}
                    >
                      前へ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPage((parseInt(page) + 1).toString())}
                    >
                      次へ
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-0">
          <SupplierManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
