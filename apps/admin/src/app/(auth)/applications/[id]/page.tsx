"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { Loader2, ScanLine, ExternalLink } from "lucide-react";
import { IccidScanModal } from "./iccid-scan-modal";

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

interface SimLocationTag {
  id: number;
  code: string;
  name: string;
}

interface LineTag {
  id: number;
  code: string;
  name: string;
}

interface LineReserveTag {
  id: number;
  code: string;
  name: string;
}

interface Sim {
  iccid: string;
  msisdn: string | null;
  simLocationTag: SimLocationTag | null;
}

interface ApplicationLine {
  id: string;
  lineNumber: number;
  simId: string | null;
  msisdn: string | null;
  status: string;
  shippedAt: string | null;
  returnedAt: string | null;
  contractMonth: string | null;
  sim: Sim | null;
  lineTag: LineTag | null;
  lineReserveTag: LineReserveTag | null;
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
  note: string | null;
  createdAt: string;
  customer: Customer;
  service: Service;
  plan: Plan;
  lines: ApplicationLine[];
  kycImages: KycImage[];
  stats: {
    lineCount: number;
    shippedCount: number;
    unassignedCount: number;
    returnedCount: number;
  };
  latestExpiryDate: string | null;
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

const LINE_STATUS_LABELS: Record<string, string> = {
  UNASSIGNED: "未割当",
  ASSIGNED: "割当済み",
  SHIPPED: "発送済み",
  ACTIVE: "利用中",
  CANCELLED: "解約済み",
  RETURNED: "返却済み",
};

const LINE_STATUS_VARIANTS: Record<string, "default" | "success" | "destructive" | "secondary" | "outline"> = {
  UNASSIGNED: "secondary",
  ASSIGNED: "default",
  SHIPPED: "default",
  ACTIVE: "success",
  CANCELLED: "destructive",
  RETURNED: "destructive",
};

const KYC_TYPE_LABELS: Record<string, string> = {
  ID_FRONT: "身分証（表）",
  ID_BACK: "身分証（裏）",
  SELFIE: "自撮り",
  ADDRESS_PROOF: "住所証明",
  CORPORATE_REGISTRY: "登記簿謄本",
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [lineTags, setLineTags] = useState<LineTag[]>([]);
  const [lineReserveTags, setLineReserveTags] = useState<LineReserveTag[]>([]);
  const [simLocationTags, setSimLocationTags] = useState<SimLocationTag[]>([]);
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());

  const fetchApplication = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${id}`);
      if (res.ok) {
        const data = await res.json();
        setApplication(data);
      }
    } catch (error) {
      console.error("申し込み取得エラー:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  // タグ一覧取得
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const [lineTagsRes, reserveTagsRes, locationTagsRes] = await Promise.all([
          fetch("/api/line-tags"),
          fetch("/api/line-reserve-tags"),
          fetch("/api/sim-location-tags"),
        ]);

        if (lineTagsRes.ok) setLineTags(await lineTagsRes.json());
        if (reserveTagsRes.ok) setLineReserveTags(await reserveTagsRes.json());
        if (locationTagsRes.ok) setSimLocationTags(await locationTagsRes.json());
      } catch (error) {
        console.error("タグ取得エラー:", error);
      }
    };
    fetchTags();
  }, []);

  const updateLine = async (lineId: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/applications/${id}/lines/${lineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        fetchApplication();
      }
    } catch (error) {
      console.error("回線更新エラー:", error);
    }
  };

  const updateSimLocationTag = async (iccid: string, simLocationTagId: number | null) => {
    try {
      const res = await fetch(`/api/sims/${iccid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simLocationTagId }),
      });
      if (res.ok) {
        fetchApplication();
      }
    } catch (error) {
      console.error("SIMの場所更新エラー:", error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("ja-JP");
  };

  const formatMonth = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const getCustomerName = (customer: Customer) => {
    if (customer.type === "CORPORATE" && customer.companyName) {
      return customer.companyName;
    }
    return `${customer.lastName} ${customer.firstName}`;
  };

  const toggleLineSelection = (lineId: string) => {
    setSelectedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) {
        next.delete(lineId);
      } else {
        next.add(lineId);
      }
      return next;
    });
  };

  const toggleAllLines = () => {
    if (!application) return;
    const unassignedLines = application.lines.filter((l) => l.status === "UNASSIGNED");
    if (selectedLines.size === unassignedLines.length) {
      setSelectedLines(new Set());
    } else {
      setSelectedLines(new Set(unassignedLines.map((l) => l.id)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">申し込みが見つかりません</p>
          <Link href="/applications">
            <Button variant="outline">一覧に戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  const unassignedCount = application.lines.filter((l) => l.status === "UNASSIGNED").length;

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          申し込み詳細 - {application.applicationNumber}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {getCustomerName(application.customer)} / {application.service.name}
        </p>
      </div>
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">申込番号:</span>
                <span className="ml-2 font-mono">{application.applicationNumber}</span>
              </div>
              <div>
                <span className="text-gray-500">ステータス:</span>
                <span className="ml-2">
                  <Badge>{STATUS_LABELS[application.status]}</Badge>
                </span>
              </div>
              <div>
                <span className="text-gray-500">サービス:</span>
                <span className="ml-2">{application.service.name}</span>
              </div>
              <div>
                <span className="text-gray-500">プラン:</span>
                <span className="ml-2">{application.plan.name}</span>
              </div>
              <div>
                <span className="text-gray-500">回線数:</span>
                <span className="ml-2">{application.lineCount}回線</span>
              </div>
              <div>
                <span className="text-gray-500">単価:</span>
                <span className="ml-2">{application.unitPrice.toLocaleString()}円</span>
              </div>
              <div>
                <span className="text-gray-500">合計:</span>
                <span className="ml-2 font-bold">{application.totalAmount.toLocaleString()}円</span>
              </div>
              <div>
                <span className="text-gray-500">申込日:</span>
                <span className="ml-2">{formatDate(application.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 顧客情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">顧客情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">区分:</span>
                <span className="ml-2">
                  <Badge variant={application.customer.type === "CORPORATE" ? "default" : "secondary"}>
                    {application.customer.type === "CORPORATE" ? "法人" : "個人"}
                  </Badge>
                </span>
              </div>
              <div>
                <span className="text-gray-500">名前:</span>
                <span className="ml-2">{getCustomerName(application.customer)}</span>
              </div>
              <div>
                <span className="text-gray-500">メール:</span>
                <span className="ml-2">
                  <a href={`mailto:${application.customer.email}`} className="text-blue-600 hover:underline">
                    {application.customer.email}
                  </a>
                </span>
              </div>
              <div>
                <span className="text-gray-500">電話:</span>
                <span className="ml-2">{application.customer.phone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">住所:</span>
                <span className="ml-2">
                  〒{application.customer.postalCode} {application.customer.prefecture}
                  {application.customer.city}{application.customer.address}
                  {application.customer.building}
                </span>
              </div>
              {application.customer.type === "CORPORATE" && application.customer.companyPostalCode && (
                <div className="col-span-2">
                  <span className="text-gray-500">法人住所:</span>
                  <span className="ml-2">
                    〒{application.customer.companyPostalCode} {application.customer.companyPrefecture}
                    {application.customer.companyCity}{application.customer.companyAddress}
                    {application.customer.companyBuilding}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KYC画像 */}
        <Card id="kyc">
          <CardHeader>
            <CardTitle className="text-base">本人確認書類</CardTitle>
          </CardHeader>
          <CardContent>
            {application.kycImages.length === 0 ? (
              <p className="text-gray-500">書類がありません</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {application.kycImages.map((img) => (
                  <div key={img.id} className="border rounded-lg p-3">
                    <div className="text-sm font-medium mb-2">
                      {KYC_TYPE_LABELS[img.type] || img.type}
                    </div>
                    <a
                      href={img.storagePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      画像を表示
                    </a>
                    {img.expiryDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        有効期限: {formatDate(img.expiryDate)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 回線管理 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">
                回線管理
                <span className="text-sm font-normal text-gray-500 ml-2">
                  {application.lines.length}回線（未割当: {unassignedCount}）
                </span>
              </CardTitle>
              {unassignedCount > 0 && (
                <Button onClick={() => setShowScanModal(true)}>
                  <ScanLine className="h-4 w-4 mr-2" />
                  ICCID連続入力
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-2 w-8">
                      <input
                        type="checkbox"
                        checked={
                          unassignedCount > 0 &&
                          selectedLines.size === application.lines.filter((l) => l.status === "UNASSIGNED").length
                        }
                        onChange={toggleAllLines}
                        disabled={unassignedCount === 0}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left py-2 px-2 whitespace-nowrap">#</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap">電話番号</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap">ICCID</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap">SIMの場所</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap">回線タグ</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap">予備タグ</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap">発送日</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap">返却日</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap">契約月</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {application.lines.map((line) => (
                    <tr key={line.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2">
                        <input
                          type="checkbox"
                          checked={selectedLines.has(line.id)}
                          onChange={() => toggleLineSelection(line.id)}
                          disabled={line.status !== "UNASSIGNED"}
                          className="rounded"
                        />
                      </td>
                      <td className="py-2 px-2">{line.lineNumber}</td>
                      <td className="py-2 px-2">{line.msisdn || "—"}</td>
                      <td className="py-2 px-2 font-mono text-xs">
                        {line.simId ? (
                          <Link
                            href={`/sims/${line.simId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {line.simId}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {line.sim ? (
                          <select
                            className="px-2 py-1 border rounded text-xs min-w-[80px]"
                            value={line.sim.simLocationTag?.id?.toString() || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              updateSimLocationTag(
                                line.simId!,
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
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <select
                          className="px-2 py-1 border rounded text-xs min-w-[80px]"
                          value={line.lineTag?.id?.toString() || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateLine(line.id, {
                              lineTagId: value ? parseInt(value) : null,
                            });
                          }}
                        >
                          <option value="">未設定</option>
                          {lineTags.map((tag) => (
                            <option key={tag.id} value={tag.id.toString()}>
                              {tag.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <select
                          className="px-2 py-1 border rounded text-xs min-w-[80px]"
                          value={line.lineReserveTag?.id?.toString() || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateLine(line.id, {
                              lineReserveTagId: value ? parseInt(value) : null,
                            });
                          }}
                        >
                          <option value="">未設定</option>
                          {lineReserveTags.map((tag) => (
                            <option key={tag.id} value={tag.id.toString()}>
                              {tag.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="date"
                          className="px-2 py-1 border rounded text-xs"
                          value={line.shippedAt ? line.shippedAt.split("T")[0] : ""}
                          onChange={(e) => {
                            updateLine(line.id, {
                              shippedAt: e.target.value ? new Date(e.target.value) : null,
                              status: e.target.value ? "SHIPPED" : line.status,
                            });
                          }}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="date"
                          className="px-2 py-1 border rounded text-xs"
                          value={line.returnedAt ? line.returnedAt.split("T")[0] : ""}
                          onChange={(e) => {
                            updateLine(line.id, {
                              returnedAt: e.target.value ? new Date(e.target.value) : null,
                              status: e.target.value ? "RETURNED" : line.status,
                            });
                          }}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="month"
                          className="px-2 py-1 border rounded text-xs"
                          value={formatMonth(line.contractMonth)}
                          onChange={(e) => {
                            updateLine(line.id, {
                              contractMonth: e.target.value ? new Date(e.target.value + "-01") : null,
                            });
                          }}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          className="px-2 py-1 border rounded text-xs"
                          value={line.status}
                          onChange={(e) => {
                            updateLine(line.id, { status: e.target.value });
                          }}
                        >
                          {Object.entries(LINE_STATUS_LABELS).map(([value, label]) => (
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
          </CardContent>
        </Card>

        {/* コメント */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">管理用コメント</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  コメント1
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={3}
                  defaultValue={application.comment1 || ""}
                  onBlur={(e) => {
                    if (e.target.value !== (application.comment1 || "")) {
                      fetch(`/api/applications/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ comment1: e.target.value }),
                      });
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  コメント2
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={3}
                  defaultValue={application.comment2 || ""}
                  onBlur={(e) => {
                    if (e.target.value !== (application.comment2 || "")) {
                      fetch(`/api/applications/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ comment2: e.target.value }),
                      });
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

      {/* ICCIDスキャンモーダル */}
      {showScanModal && (
        <IccidScanModal
          applicationId={id}
          unassignedCount={unassignedCount}
          lineTags={lineTags}
          lineReserveTags={lineReserveTags}
          onClose={() => setShowScanModal(false)}
          onComplete={() => {
            setShowScanModal(false);
            fetchApplication();
          }}
        />
      )}
    </div>
  );
}
