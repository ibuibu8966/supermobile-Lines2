"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { Filter, ChevronDown, ChevronUp, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryState } from "nuqs";
import { CustomerDetailModal } from "@/components/customer-detail-modal";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api";

interface ApplicationLine {
  id: string;
  applicationId: string;
  lineNumber: number;
  simId: string | null;
  msisdn: string | null;
  status: string;
  shippedAt: Date | null;
  returnedAt: Date | null;
  lineReserveTagId: number | null;
  application: {
    customer: {
      lastName: string;
      firstName: string;
      companyName: string | null;
      type: string;
      lastNameKana: string | null;
      firstNameKana: string | null;
      companyNameKana: string | null;
      birthDate: Date | null;
      postalCode: string | null;
      prefecture: string | null;
      city: string | null;
      address: string | null;
      building: string | null;
      companyPostalCode: string | null;
      companyPrefecture: string | null;
      companyCity: string | null;
      companyAddress: string | null;
      companyBuilding: string | null;
      email: string | null;
      phone: string | null;
    };
    service: {
      id: string;
      name: string;
      code: string;
    } | null;
    plan: {
      id: string;
      name: string;
      code: string;
    } | null;
  };
  sim: {
    iccid: string;
    msisdn: string | null;
    simLocationTagId: number | null;
    simLocationTag: {
      id: number;
      name: string;
    } | null;
  } | null;
  lineReserveTag: {
    id: number;
    name: string;
  } | null;
}

interface LinesResponse {
  data: ApplicationLine[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  UNASSIGNED: "未開通",
  ASSIGNED: "開通済み",
  SHIPPED: "発送済み",
  ACTIVE: "利用中",
  CANCELLED: "解約済み",
  RETURNED: "返却済み",
};

const STATUS_VARIANTS: Record<string, "default" | "success" | "destructive" | "secondary" | "outline"> = {
  UNASSIGNED: "secondary",
  ASSIGNED: "default",
  SHIPPED: "outline",
  ACTIVE: "success",
  CANCELLED: "destructive",
  RETURNED: "secondary",
};

export function LinesClient() {
  const queryClient = useQueryClient();

  // Tags from cache (prefetched at login)
  const { data: simLocationTags = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: queryKeys.simLocationTags,
    queryFn: api.getSimLocationTags,
  });

  const { data: lineReserveTags = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: queryKeys.lineReserveTags,
    queryFn: api.getLineReserveTags,
  });

  // Filter states
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [simLocationTagIds, setSimLocationTagIds] = useQueryState("simLocationTagIds", { defaultValue: "" });
  const [lineReserveTagIds, setLineReserveTagIds] = useQueryState("lineReserveTagIds", { defaultValue: "" });
  const [statuses, setStatuses] = useQueryState("statuses", { defaultValue: "" });
  const [shippedFrom, setShippedFrom] = useQueryState("shippedFrom", { defaultValue: "" });
  const [shippedTo, setShippedTo] = useQueryState("shippedTo", { defaultValue: "" });
  const [returnedFrom, setReturnedFrom] = useQueryState("returnedFrom", { defaultValue: "" });
  const [returnedTo, setReturnedTo] = useQueryState("returnedTo", { defaultValue: "" });
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });

  const [searchInput, setSearchInput] = useState(search);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [selectedCustomer, setSelectedCustomer] = useState<ApplicationLine["application"]["customer"] | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Bulk edit states
  const [bulkSimLocationTagId, setBulkSimLocationTagId] = useState<number | null>(null);
  const [bulkLineReserveTagId, setBulkLineReserveTagId] = useState<number | null>(null);
  const [bulkShippedAt, setBulkShippedAt] = useState("");
  const [bulkReturnedAt, setBulkReturnedAt] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Inline edit states (保存ボタン方式)
  const [editedLines, setEditedLines] = useState<Record<string, Partial<{
    simLocationTagId: number | null;
    lineReserveTagId: number | null;
    shippedAt: string | null;
    returnedAt: string | null;
    status: string;
  }>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // フィルターが設定されているかチェック
  const hasFilters = !!(search || simLocationTagIds || lineReserveTagIds || statuses || shippedFrom || shippedTo || returnedFrom || returnedTo || page !== "1");

  // クエリパラメータ生成
  const queryParams = useMemo(() => {
    if (!hasFilters) return undefined;
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (simLocationTagIds) params.simLocationTagIds = simLocationTagIds;
    if (lineReserveTagIds) params.lineReserveTagIds = lineReserveTagIds;
    if (statuses) params.statuses = statuses;
    if (shippedFrom) params.shippedFrom = shippedFrom;
    if (shippedTo) params.shippedTo = shippedTo;
    if (returnedFrom) params.returnedFrom = returnedFrom;
    if (returnedTo) params.returnedTo = returnedTo;
    params.page = page;
    return params;
  }, [hasFilters, search, simLocationTagIds, lineReserveTagIds, statuses, shippedFrom, shippedTo, returnedFrom, returnedTo, page]);

  // Lines data from cache (prefetched at login for default view)
  const { data: linesData, isLoading: isLoadingLines, error } = useQuery<LinesResponse>({
    queryKey: queryKeys.lines(queryParams),
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (simLocationTagIds) params.set("simLocationTagIds", simLocationTagIds);
      if (lineReserveTagIds) params.set("lineReserveTagIds", lineReserveTagIds);
      if (statuses) params.set("statuses", statuses);
      if (shippedFrom) params.set("shippedFrom", shippedFrom);
      if (shippedTo) params.set("shippedTo", shippedTo);
      if (returnedFrom) params.set("returnedFrom", returnedFrom);
      if (returnedTo) params.set("returnedTo", returnedTo);
      params.set("page", page);
      return api.getLines(params);
    },
  });

  const lines = linesData?.data || [];
  const pagination = linesData?.pagination || null;
  const currentQueryKey = queryKeys.lines(queryParams);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage("1");
  };

  const toggleSelectAll = () => {
    if (selectedLines.size === lines.length) {
      setSelectedLines(new Set());
    } else {
      setSelectedLines(new Set(lines.map((line) => line.id)));
    }
  };

  const toggleSelectLine = (lineId: string) => {
    const newSelected = new Set(selectedLines);
    if (newSelected.has(lineId)) {
      newSelected.delete(lineId);
    } else {
      newSelected.add(lineId);
    }
    setSelectedLines(newSelected);
  };

  const handleBulkUpdate = async () => {
    if (selectedLines.size === 0) {
      toast.error("回線を選択してください");
      return;
    }

    const updates: any = {};
    if (bulkSimLocationTagId !== null) updates.simLocationTagId = bulkSimLocationTagId;
    if (bulkLineReserveTagId !== null) updates.lineReserveTagId = bulkLineReserveTagId;
    if (bulkShippedAt) updates.shippedAt = bulkShippedAt;
    if (bulkReturnedAt) updates.returnedAt = bulkReturnedAt;
    if (bulkStatus) updates.status = bulkStatus;

    if (Object.keys(updates).length === 0) {
      toast.error("更新する項目を選択してください");
      return;
    }

    setBulkUpdating(true);
    try {
      const res = await fetch("/api/lines/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineIds: Array.from(selectedLines),
          ...updates,
        }),
      });

      if (res.ok) {
        toast.success(`${selectedLines.size}件を更新しました`);
        setSelectedLines(new Set());
        setBulkSimLocationTagId(null);
        setBulkLineReserveTagId(null);
        setBulkShippedAt("");
        setBulkReturnedAt("");
        setBulkStatus("");
        queryClient.invalidateQueries({ queryKey: currentQueryKey });
      } else {
        throw new Error("一括更新に失敗しました");
      }
    } catch (err) {
      toast.error("一括更新に失敗しました");
    } finally {
      setBulkUpdating(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  const getCustomerName = (line: ApplicationLine) => {
    const customer = line.application.customer;
    if (customer.type === "CORPORATE" && customer.companyName) {
      return customer.companyName;
    }
    return `${customer.lastName} ${customer.firstName}`;
  };

  // 編集用ヘルパー関数
  const handleFieldChange = (lineId: string, field: string, value: any) => {
    setEditedLines((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], [field]: value },
    }));
  };

  const getEditedValue = <T,>(line: ApplicationLine, field: string, originalValue: T): T => {
    const edited = editedLines[line.id];
    if (edited && field in edited) {
      return edited[field as keyof typeof edited] as T;
    }
    return originalValue;
  };

  const hasChanges = () => Object.keys(editedLines).length > 0;

  const hasLineChanges = (lineId: string) => lineId in editedLines;

  const getChangedLinesCount = () => Object.keys(editedLines).length;

  const cancelChanges = () => setEditedLines({});

  const saveChanges = async () => {
    if (!hasChanges()) return;

    const changesCount = getChangedLinesCount();
    const currentEditedLines = { ...editedLines };

    // 楽観的更新: まずUIを即座に更新
    queryClient.setQueryData<LinesResponse>(currentQueryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((line) => {
          const changes = currentEditedLines[line.id];
          if (!changes) return line;
          return {
            ...line,
            ...(changes.lineReserveTagId !== undefined && { lineReserveTagId: changes.lineReserveTagId }),
            ...(changes.status !== undefined && { status: changes.status }),
            ...(changes.shippedAt !== undefined && { shippedAt: changes.shippedAt ? new Date(changes.shippedAt) : null }),
            ...(changes.returnedAt !== undefined && { returnedAt: changes.returnedAt ? new Date(changes.returnedAt) : null }),
            sim: line.sim && changes.simLocationTagId !== undefined
              ? { ...line.sim, simLocationTagId: changes.simLocationTagId }
              : line.sim,
          };
        }),
      };
    });

    // 編集状態をクリア（UIは既に更新済み）
    setEditedLines({});
    toast.success(`${changesCount}件の変更を保存しました`);

    // バックグラウンドでAPIを呼び出し
    setIsSaving(true);
    try {
      const promises = Object.entries(currentEditedLines).map(([lineId, changes]) =>
        fetch(`/api/lines/${lineId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        })
      );

      const results = await Promise.all(promises);
      const allSucceeded = results.every((res) => res.ok);

      if (!allSucceeded) {
        // 失敗した場合は再取得して正しい状態に戻す
        toast.error("一部の保存に失敗しました。データを再取得します。");
        queryClient.invalidateQueries({ queryKey: currentQueryKey });
      }
    } catch (err) {
      toast.error("保存に失敗しました。データを再取得します。");
      queryClient.invalidateQueries({ queryKey: currentQueryKey });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">総合回線管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            全回線の一覧表示・フィルター・編集
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pagination && (
            <span className="text-sm text-gray-500">
              表示: {pagination.total.toLocaleString()}件
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            フィルター
            {showFilters ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm flex items-center gap-2 mb-4">
          <AlertCircle className="h-4 w-4" />
          データの取得に失敗しました。
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <input
                type="text"
                placeholder="申込者名"
                className="px-3 py-2 border rounded-md"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <input
                type="text"
                placeholder="会社名"
                className="px-3 py-2 border rounded-md"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <input
                type="text"
                placeholder="電話番号"
                className="px-3 py-2 border rounded-md"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <input
                type="text"
                placeholder="ICCID"
                className="px-3 py-2 border rounded-md"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* SIM Location Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SIMの場所
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
                  {simLocationTags.map((tag) => (
                    <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={simLocationTagIds.split(",").includes(tag.id.toString())}
                        onChange={(e) => {
                          const ids = simLocationTagIds.split(",").filter(Boolean);
                          if (e.target.checked) {
                            ids.push(tag.id.toString());
                          } else {
                            const index = ids.indexOf(tag.id.toString());
                            if (index > -1) ids.splice(index, 1);
                          }
                          setSimLocationTagIds(ids.join(","));
                          setPage("1");
                        }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Line Reserve Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  予備タグ
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
                  {lineReserveTags.map((tag) => (
                    <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={lineReserveTagIds.split(",").includes(tag.id.toString())}
                        onChange={(e) => {
                          const ids = lineReserveTagIds.split(",").filter(Boolean);
                          if (e.target.checked) {
                            ids.push(tag.id.toString());
                          } else {
                            const index = ids.indexOf(tag.id.toString());
                            if (index > -1) ids.splice(index, 1);
                          }
                          setLineReserveTagIds(ids.join(","));
                          setPage("1");
                        }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Statuses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={statuses.split(",").includes(value)}
                        onChange={(e) => {
                          const vals = statuses.split(",").filter(Boolean);
                          if (e.target.checked) {
                            vals.push(value);
                          } else {
                            const index = vals.indexOf(value);
                            if (index > -1) vals.splice(index, 1);
                          }
                          setStatuses(vals.join(","));
                          setPage("1");
                        }}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  発送日
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="px-3 py-2 border rounded-md flex-1"
                    value={shippedFrom}
                    onChange={(e) => {
                      setShippedFrom(e.target.value);
                      setPage("1");
                    }}
                  />
                  <span className="text-gray-500">～</span>
                  <input
                    type="date"
                    className="px-3 py-2 border rounded-md flex-1"
                    value={shippedTo}
                    onChange={(e) => {
                      setShippedTo(e.target.value);
                      setPage("1");
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  返却日
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="px-3 py-2 border rounded-md flex-1"
                    value={returnedFrom}
                    onChange={(e) => {
                      setReturnedFrom(e.target.value);
                      setPage("1");
                    }}
                  />
                  <span className="text-gray-500">～</span>
                  <input
                    type="date"
                    className="px-3 py-2 border rounded-md flex-1"
                    value={returnedTo}
                    onChange={(e) => {
                      setReturnedTo(e.target.value);
                      setPage("1");
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Edit Bar */}
      {selectedLines.size > 0 && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedLines.size}件選択中
              </span>
              <select
                className="px-3 py-1.5 border rounded-md text-sm"
                value={bulkSimLocationTagId?.toString() || ""}
                onChange={(e) => setBulkSimLocationTagId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">SIMの場所</option>
                {simLocationTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
              <select
                className="px-3 py-1.5 border rounded-md text-sm"
                value={bulkLineReserveTagId?.toString() || ""}
                onChange={(e) => setBulkLineReserveTagId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">予備タグ</option>
                {lineReserveTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="px-3 py-1.5 border rounded-md text-sm"
                value={bulkShippedAt}
                onChange={(e) => setBulkShippedAt(e.target.value)}
                placeholder="発送日"
              />
              <input
                type="date"
                className="px-3 py-1.5 border rounded-md text-sm"
                value={bulkReturnedAt}
                onChange={(e) => setBulkReturnedAt(e.target.value)}
                placeholder="返却日"
              />
              <select
                className="px-3 py-1.5 border rounded-md text-sm"
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
              >
                <option value="">ステータス</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={handleBulkUpdate}
                disabled={bulkUpdating}
              >
                {bulkUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    適用中...
                  </>
                ) : (
                  "適用"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unsaved Changes Bar */}
      {hasChanges() && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-800">
                未保存の変更があります（{getChangedLinesCount()}件）
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelChanges}
                  disabled={isSaving}
                >
                  キャンセル
                </Button>
                <Button
                  size="sm"
                  onClick={saveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "保存"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            回線一覧
            {pagination && (
              <span className="text-sm font-normal text-gray-500">
                {pagination.total.toLocaleString()}件
              </span>
            )}
            {isLoadingLines && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lines.length === 0 && !isLoadingLines ? (
            <div className="text-center py-12 text-gray-500">
              回線が見つかりません
            </div>
          ) : lines.length === 0 && isLoadingLines ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 w-8">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedLines.size === lines.length && lines.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-4">申込者名</th>
                    <th className="text-left py-3 px-4">会社名</th>
                    <th className="text-left py-3 px-4">サービス</th>
                    <th className="text-left py-3 px-4">プラン</th>
                    <th className="text-left py-3 px-4">電話番号</th>
                    <th className="text-left py-3 px-4">ICCID</th>
                    <th className="text-left py-3 px-4">SIMの場所</th>
                    <th className="text-left py-3 px-4">予備タグ</th>
                    <th className="text-left py-3 px-4">発送日</th>
                    <th className="text-left py-3 px-4">返却日</th>
                    <th className="text-left py-3 px-4">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.id} className={`border-b hover:bg-gray-50 ${hasLineChanges(line.id) ? "bg-yellow-50" : ""}`}>
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedLines.has(line.id)}
                          onChange={() => toggleSelectLine(line.id)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedCustomer(line.application.customer);
                            setIsCustomerModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                        >
                          {getCustomerName(line)}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        {line.application.customer.companyName || "—"}
                      </td>
                      <td className="py-3 px-4">
                        {line.application.service?.name || "—"}
                      </td>
                      <td className="py-3 px-4">
                        {line.application.plan?.name || "—"}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {line.msisdn || line.sim?.msisdn || "—"}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {line.simId || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          className="px-2 py-1 border rounded text-sm min-w-[120px]"
                          value={getEditedValue(line, "simLocationTagId", line.sim?.simLocationTagId)?.toString() || ""}
                          onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : null;
                            handleFieldChange(line.id, "simLocationTagId", value);
                          }}
                          disabled={!line.simId}
                        >
                          <option value="">選択してください</option>
                          {simLocationTags.map((tag) => (
                            <option key={tag.id} value={tag.id}>
                              {tag.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          className="px-2 py-1 border rounded text-sm min-w-[120px]"
                          value={getEditedValue(line, "lineReserveTagId", line.lineReserveTagId)?.toString() || ""}
                          onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : null;
                            handleFieldChange(line.id, "lineReserveTagId", value);
                          }}
                        >
                          <option value="">選択してください</option>
                          {lineReserveTags.map((tag) => (
                            <option key={tag.id} value={tag.id}>
                              {tag.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="date"
                          className="px-2 py-1 border rounded text-sm"
                          value={getEditedValue(line, "shippedAt", formatDate(line.shippedAt))}
                          onChange={(e) => {
                            handleFieldChange(line.id, "shippedAt", e.target.value || null);
                          }}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="date"
                          className="px-2 py-1 border rounded text-sm"
                          value={getEditedValue(line, "returnedAt", formatDate(line.returnedAt))}
                          onChange={(e) => {
                            handleFieldChange(line.id, "returnedAt", e.target.value || null);
                          }}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          className="px-2 py-1 border rounded text-sm"
                          value={getEditedValue(line, "status", line.status)}
                          onChange={(e) => {
                            handleFieldChange(line.id, "status", e.target.value);
                          }}
                        >
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
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

      {selectedCustomer && (
        <CustomerDetailModal
          open={isCustomerModalOpen}
          onOpenChange={setIsCustomerModalOpen}
          customer={selectedCustomer}
        />
      )}
    </div>
  );
}
