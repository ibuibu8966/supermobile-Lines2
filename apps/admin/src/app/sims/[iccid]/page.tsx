"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { ArrowLeft, Loader2, Phone, Building2, User, Calendar, Tag, CheckCircle, XCircle } from "lucide-react";

interface UsageTag {
  id: number;
  code: string;
  name: string;
  category: string | null;
}

interface Customer {
  id: string;
  lastName: string;
  firstName: string;
  companyName: string | null;
  type: string;
  email: string;
  phone: string;
}

interface Contract {
  id: string;
  serviceName: string;
  contractStart: string | null;
  contractEnd: string | null;
  status: string;
  shippedAt: string | null;
  arrivedAt: string | null;
  returnedAt: string | null;
  createdAt: string;
  customer: Customer | null;
  usageTags: Array<{
    usageTag: UsageTag;
  }>;
}

interface Supplier {
  id: number;
  code: string;
  name: string;
}

interface SimDetail {
  iccid: string;
  msisdn: string | null;
  simType: string;
  carrierType: string | null;
  plan: string | null;
  status: string;
  isMnpEligible: boolean;
  isAutoCancel: boolean;
  supplierContractStart: string | null;
  supplierContractEnd: string | null;
  createdAt: string;
  updatedAt: string;
  supplier: Supplier;
  contracts: Contract[];
  consumedTags: UsageTag[];
  availableTags: UsageTag[];
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

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-400",
  SHIPPED: "bg-blue-500",
  ACTIVE: "bg-green-500",
  ENDED: "bg-gray-500",
  CANCELLED: "bg-red-500",
};

const CARRIER_LABELS: Record<string, string> = {
  DOCOMO: "docomo",
  AU: "au",
  SOFTBANK: "SoftBank",
  RAKUTEN: "楽天",
};

const SIM_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: "個人",
  CORPORATE: "法人",
};

export default function SimDetailPage({ params }: { params: Promise<{ iccid: string }> }) {
  const resolvedParams = use(params);
  const [sim, setSim] = useState<SimDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSim = async () => {
      try {
        const res = await fetch(`/api/sims/${resolvedParams.iccid}`);
        const data = await res.json();

        if (res.ok) {
          setSim(data);
        } else {
          setError(data.error || "SIMの取得に失敗しました");
        }
      } catch (err) {
        console.error("SIM取得エラー:", err);
        setError("SIMの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchSim();
  }, [resolvedParams.iccid]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCustomerName = (customer: Customer | null) => {
    if (!customer) return "—";
    if (customer.type === "CORPORATE" && customer.companyName) {
      return customer.companyName;
    }
    return `${customer.lastName} ${customer.firstName}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !sim) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link href="/sims" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">SIM詳細</h1>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center text-red-500">
              {error || "SIMが見つかりません"}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/sims" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-mono">
                  {sim.iccid}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  SIM詳細情報
                </p>
              </div>
            </div>
            <Badge variant={STATUS_VARIANTS[sim.status] || "default"} className="text-sm px-3 py-1">
              {STATUS_LABELS[sim.status] || sim.status}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">電話番号</p>
                  <p className="font-medium">{sim.msisdn || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">キャリア</p>
                  <p className="font-medium">
                    {sim.carrierType ? CARRIER_LABELS[sim.carrierType] || sim.carrierType : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">回線タイプ</p>
                  <p className="font-medium">
                    {SIM_TYPE_LABELS[sim.simType] || sim.simType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">仕入れ先</p>
                  <p className="font-medium">{sim.supplier.name}</p>
                </div>
              </div>
              {sim.plan && (
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">プラン</p>
                    <p className="font-medium">{sim.plan}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">仕入れ先契約期間</p>
                  <p className="font-medium text-sm">
                    {formatDate(sim.supplierContractStart)} 〜 {formatDate(sim.supplierContractEnd)}
                  </p>
                </div>
              </div>
              <div className="border-t pt-4 mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">MNP可否</span>
                  <Badge variant={sim.isMnpEligible ? "success" : "destructive"}>
                    {sim.isMnpEligible ? "可" : "不可"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">自動解約</span>
                  <Badge variant={sim.isAutoCancel ? "destructive" : "secondary"}>
                    {sim.isAutoCancel ? "対象" : "対象外"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 用途タグ状況 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">用途タグ状況</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  消費済み（販売不可）
                </p>
                <div className="flex flex-wrap gap-2">
                  {sim.consumedTags.length > 0 ? (
                    sim.consumedTags.map((tag) => (
                      <Badge key={tag.id} variant="destructive">
                        {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">なし</span>
                  )}
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  販売可能
                </p>
                <div className="flex flex-wrap gap-2">
                  {sim.availableTags.length > 0 ? (
                    sim.availableTags.map((tag) => (
                      <Badge key={tag.id} variant="success">
                        {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">なし</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* メタ情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">システム情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">登録日時</span>
                <span>{formatDateTime(sim.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">更新日時</span>
                <span>{formatDateTime(sim.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">契約回数</span>
                <span>{sim.contracts.length}回</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 契約履歴タイムライン */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">契約履歴</CardTitle>
          </CardHeader>
          <CardContent>
            {sim.contracts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                契約履歴がありません
              </div>
            ) : (
              <div className="relative">
                {/* タイムラインの縦線 */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                <div className="space-y-6">
                  {sim.contracts.map((contract, index) => (
                    <div key={contract.id} className="relative pl-10">
                      {/* タイムラインのドット */}
                      <div
                        className={`absolute left-2 w-5 h-5 rounded-full border-2 border-white ${
                          CONTRACT_STATUS_COLORS[contract.status] || "bg-gray-400"
                        }`}
                      />

                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{contract.serviceName}</span>
                              <Badge variant="outline">
                                {CONTRACT_STATUS_LABELS[contract.status] || contract.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(contract.contractStart)} 〜{" "}
                              {contract.contractEnd ? formatDate(contract.contractEnd) : "現在"}
                            </p>
                          </div>
                          <div className="text-right text-xs text-gray-400">
                            #{sim.contracts.length - index}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">顧客</p>
                            <p className="font-medium">{getCustomerName(contract.customer)}</p>
                            {contract.customer && (
                              <p className="text-xs text-gray-400">{contract.customer.email}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">用途タグ</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {contract.usageTags.length > 0 ? (
                                contract.usageTags.map((ut) => (
                                  <Badge key={ut.usageTag.id} variant="secondary" className="text-xs">
                                    {ut.usageTag.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 配送情報 */}
                        {(contract.shippedAt || contract.arrivedAt || contract.returnedAt) && (
                          <div className="mt-3 pt-3 border-t text-xs text-gray-500 flex gap-4">
                            {contract.shippedAt && (
                              <span>発送: {formatDate(contract.shippedAt)}</span>
                            )}
                            {contract.arrivedAt && (
                              <span>到着: {formatDate(contract.arrivedAt)}</span>
                            )}
                            {contract.returnedAt && (
                              <span>返却: {formatDate(contract.returnedAt)}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* 仕入れイベント */}
                  <div className="relative pl-10">
                    <div className="absolute left-2 w-5 h-5 rounded-full border-2 border-white bg-blue-400" />
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-700">仕入れ</span>
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {sim.supplier.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        {formatDate(sim.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* アクションボタン */}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline">
            編集
          </Button>
          <Button variant="outline">
            契約を追加
          </Button>
        </div>
      </main>
    </div>
  );
}
