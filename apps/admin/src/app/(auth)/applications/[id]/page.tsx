"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui";
import {
  Loader2,
  ScanLine,
  ExternalLink,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { IccidScanModal } from "./iccid-scan-modal";
import { KycModal } from "@/components/kyc-modal";
import { toast } from "sonner";

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
  signedUrl: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
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

// 回線フィールドの変更を蓄積するための型
interface PendingLineChange {
  simId?: string | null;
  simLocationTagId?: number | null;
  lineTagId?: number | null;
  lineReserveTagId?: number | null;
  shippedAt?: string | null;
  returnedAt?: string | null;
  contractMonth?: string | null;
  status?: string;
}

interface Application {
  id: string;
  applicationNumber: string;
  status: string;
  kycStatus: "PENDING" | "DEFICIENT" | "RESUBMIT" | "COMPLETED";
  paymentStatus: "BEFORE_INVOICE" | "INVOICED" | "PAID";
  lineCount: number;
  unitPrice: number;
  totalAmount: number;
  couponCode: string | null;
  couponId: string | null;
  comment1: string | null;
  comment2: string | null;
  note: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  customer: Customer;
  service: Service;
  plan: Plan;
  lines: ApplicationLine[];
  kycImages: KycImage[];
  stats: {
    lineCount: number;
    shippedCount: number;
    notActivatedCount: number;
    returnedCount: number;
  };
  latestExpiryDate: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "申込済み",
  PAYMENT_PENDING: "入金待ち",
  PAID: "入金済み",
  SHIPPING: "発送中",
  COMPLETED: "完了",
  CANCELLED: "キャンセル",
};

const LINE_STATUS_LABELS: Record<string, string> = {
  NOT_ACTIVATED: "未開通",
  ACTIVATED: "開通済み",
  SHIPPED: "発送済み",
  RETURNED: "返却済み",
  CANCELLED: "解約",
};

const LINE_STATUS_VARIANTS: Record<string, "default" | "success" | "destructive" | "secondary" | "outline"> = {
  NOT_ACTIVATED: "secondary",
  ACTIVATED: "success",
  SHIPPED: "default",
  RETURNED: "destructive",
  CANCELLED: "destructive",
};

const KYC_TYPE_LABELS: Record<string, string> = {
  ID_FRONT: "身分証（表）",
  ID_BACK: "身分証（裏）",
  SELFIE: "自撮り",
  ADDRESS_PROOF: "住所証明",
  CORPORATE_REGISTRY: "登記簿謄本",
};

const KYC_STATUS_OPTIONS = [
  { value: "PENDING", label: "未確認" },
  { value: "DEFICIENT", label: "不備" },
  { value: "RESUBMIT", label: "再提出" },
  { value: "COMPLETED", label: "完了" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "BEFORE_INVOICE", label: "請求書発行前" },
  { value: "INVOICED", label: "請求書発行済み" },
  { value: "PAID", label: "入金済み" },
];

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

  // KycModal関連の状態
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [kycModalInitialType, setKycModalInitialType] = useState<string | undefined>(undefined);

  // 身分証有効期限編集の状態
  const [isEditingExpiry, setIsEditingExpiry] = useState(false);
  const [editExpiryValue, setEditExpiryValue] = useState("");

  // アーカイブ関連の状態
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [archiveProcessing, setArchiveProcessing] = useState(false);

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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("ja-JP");
  };

  const formatMonth = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  // ステータス更新
  const updateApplicationField = async (field: string, value: unknown) => {
    if (!application) return;
    // 楽観的更新
    setApplication({ ...application, [field]: value });
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        toast.success("更新しました");
      } else {
        throw new Error("更新に失敗しました");
      }
    } catch {
      toast.error("更新に失敗しました");
      fetchApplication();
    }
  };

  // 有効期限更新
  const handleSaveExpiry = async () => {
    if (!application) return;
    // 全てのKYC画像のexpiryDateを更新
    try {
      await Promise.all(
        application.kycImages.map((img) =>
          fetch(`/api/kyc-images/${img.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expiryDate: editExpiryValue || null }),
          })
        )
      );
      toast.success("有効期限を更新しました");
      setIsEditingExpiry(false);
      fetchApplication();
    } catch {
      toast.error("有効期限の更新に失敗しました");
    }
  };

  // KycModal表示
  const openKycModal = (imageType?: string) => {
    setKycModalInitialType(imageType);
    setIsKycModalOpen(true);
  };

  // アーカイブ操作
  const handleArchive = async () => {
    setArchiveProcessing(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      if (res.ok) {
        setIsArchiveConfirmOpen(false);
        fetchApplication();
      }
    } catch (error) {
      console.error("アーカイブエラー:", error);
    } finally {
      setArchiveProcessing(false);
    }
  };

  const handleUnarchive = async () => {
    setArchiveProcessing(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });
      if (res.ok) {
        fetchApplication();
      }
    } catch (error) {
      console.error("アーカイブ解除エラー:", error);
    } finally {
      setArchiveProcessing(false);
    }
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
    if (selectedLines.size === application.lines.length) {
      setSelectedLines(new Set());
    } else {
      setSelectedLines(new Set(application.lines.map((l) => l.id)));
    }
  };

  // 一括編集用の状態
  const [bulkLineTagId, setBulkLineTagId] = useState<string>("");
  const [bulkLineReserveTagId, setBulkLineReserveTagId] = useState<string>("");
  const [bulkShippedAt, setBulkShippedAt] = useState<string>("");
  const [bulkReturnedAt, setBulkReturnedAt] = useState<string>("");
  const [bulkContractMonth, setBulkContractMonth] = useState<string>("");

  const applyBulkUpdate = () => {
    if (selectedLines.size === 0) return;

    // 選択された回線に変更を適用（pendingChangesに追加）
    selectedLines.forEach((lineId) => {
      const changes: PendingLineChange = {};

      if (bulkLineTagId) {
        changes.lineTagId = bulkLineTagId === "clear" ? null : parseInt(bulkLineTagId);
      }
      if (bulkLineReserveTagId) {
        changes.lineReserveTagId = bulkLineReserveTagId === "clear" ? null : parseInt(bulkLineReserveTagId);
      }
      if (bulkShippedAt) {
        changes.shippedAt = bulkShippedAt === "clear" ? null : bulkShippedAt;
        if (bulkShippedAt !== "clear") {
          changes.status = "SHIPPED";
        }
      }
      if (bulkReturnedAt) {
        changes.returnedAt = bulkReturnedAt === "clear" ? null : bulkReturnedAt;
        if (bulkReturnedAt !== "clear") {
          changes.status = "RETURNED";
        }
      }
      if (bulkContractMonth) {
        changes.contractMonth = bulkContractMonth === "clear" ? null : bulkContractMonth + "-01";
      }

      if (Object.keys(changes).length > 0) {
        setPendingChanges((prev) => ({
          ...prev,
          [lineId]: { ...prev[lineId], ...changes },
        }));
      }
    });

    // UIリセット
    setSelectedLines(new Set());
    setBulkLineTagId("");
    setBulkLineReserveTagId("");
    setBulkShippedAt("");
    setBulkReturnedAt("");
    setBulkContractMonth("");
  };

  // 回線フィールド編集用の状態（クライアント側一時保存 - 一括更新用）
  const [pendingChanges, setPendingChanges] = useState<Record<string, PendingLineChange>>({});
  const [iccidErrors, setIccidErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateIccid = (iccid: string): string | null => {
    if (!iccid) return null; // 空は許可
    if (!/^[A-Z0-9]{15,20}$/.test(iccid.toUpperCase())) {
      return "ICCIDは15〜20桁の英数字です";
    }
    return null;
  };

  // 回線フィールドの変更を追跡
  const handleLineChange = (
    lineId: string,
    field: keyof PendingLineChange,
    value: string | number | null
  ) => {
    setPendingChanges((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        [field]: value,
      },
    }));
  };

  // ICCID変更（バリデーション付き）
  const handleIccidChange = (lineId: string, value: string) => {
    const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    handleLineChange(lineId, "simId", upperValue || null);

    // リアルタイムバリデーション
    const error = validateIccid(upperValue);
    setIccidErrors((prev) => {
      if (error) {
        return { ...prev, [lineId]: error };
      } else {
        const { [lineId]: _, ...rest } = prev;
        return rest;
      }
    });
  };

  // 現在の値を取得（保留中の変更があればそれを、なければ元の値を返す）
  const getCurrentValue = <T,>(
    lineId: string,
    field: keyof PendingLineChange,
    originalValue: T
  ): T => {
    const pending = pendingChanges[lineId];
    if (pending && field in pending) {
      return pending[field] as T;
    }
    return originalValue;
  };

  // 変更があるかチェック
  const hasChanges = () => Object.keys(pendingChanges).length > 0;

  // 特定の回線に変更があるかチェック
  const hasLineChanges = (lineId: string) => lineId in pendingChanges;

  // 変更された回線数を取得
  const getChangedLinesCount = () => Object.keys(pendingChanges).length;

  // バリデーションエラーがあるかチェック
  const hasValidationErrors = () => Object.keys(iccidErrors).length > 0;

  // 全変更を保存
  const handleSaveAll = async () => {
    if (!hasChanges() || hasValidationErrors()) return;

    setIsSaving(true);
    try {
      const updates = Object.entries(pendingChanges);

      const results = await Promise.all(
        updates.map(async ([lineId, changes]) => {
          const { simLocationTagId, ...lineChanges } = changes;

          // 回線の更新
          const lineRes = await fetch(`/api/applications/${id}/lines/${lineId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lineChanges),
          });

          // SIMの場所の更新（simLocationTagIdが変更されている場合）
          if (simLocationTagId !== undefined) {
            const line = application?.lines.find((l) => l.id === lineId);
            const simId = changes.simId !== undefined ? changes.simId : line?.simId;
            if (simId) {
              await fetch(`/api/sims/${simId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ simLocationTagId }),
              });
            }
          }

          return lineRes.ok;
        })
      );

      if (results.every((r) => r)) {
        setPendingChanges({});
        setIccidErrors({});
        fetchApplication();
      }
    } catch (error) {
      console.error("保存エラー:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // 全変更をキャンセル
  const handleCancelAll = () => {
    setPendingChanges({});
    setIccidErrors({});
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

  const notActivatedCount = application.lines.filter((l) => l.status === "NOT_ACTIVATED").length;

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              申し込み詳細 - {application.applicationNumber}
            </h1>
            {application.isArchived && (
              <Badge variant="secondary">
                アーカイブ済み
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {getCustomerName(application.customer)} / {application.service.name}
            {application.archivedAt && (
              <span className="ml-2 text-gray-400">
                （{formatDate(application.archivedAt)} アーカイブ）
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {application.isArchived ? (
            <Button
              variant="outline"
              onClick={handleUnarchive}
              disabled={archiveProcessing}
            >
              {archiveProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArchiveRestore className="h-4 w-4 mr-2" />
              )}
              アーカイブ解除
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsArchiveConfirmOpen(true)}
            >
              <Archive className="h-4 w-4 mr-2" />
              アーカイブ
            </Button>
          )}
        </div>
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
              {application.couponCode && (
                <div>
                  <span className="text-gray-500">クーポン:</span>
                  <span className="ml-2">
                    <Badge variant="outline" className="font-mono">{application.couponCode}</Badge>
                  </span>
                </div>
              )}
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

        {/* ステータス */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ステータス</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">本人確認</label>
                <select
                  className="px-3 py-2 border rounded-md text-sm w-full"
                  value={application.kycStatus}
                  onChange={(e) => updateApplicationField("kycStatus", e.target.value)}
                >
                  {KYC_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">決済確認</label>
                <select
                  className={`px-3 py-2 border rounded-md text-sm w-full ${
                    application.paymentStatus === "PAID" ? "bg-green-50 border-green-300" : ""
                  }`}
                  value={application.paymentStatus}
                  onChange={(e) => updateApplicationField("paymentStatus", e.target.value)}
                >
                  {PAYMENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* アップロード画像 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">アップロード画像</CardTitle>
          </CardHeader>
          <CardContent>
            {application.kycImages.length === 0 ? (
              <p className="text-gray-500">画像がありません</p>
            ) : (
              <div className="flex gap-8">
                {application.kycImages.map((img) => (
                  <div key={img.id}>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {KYC_TYPE_LABELS[img.type] || img.type}
                    </p>
                    <button
                      onClick={() => openKycModal(img.type)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      表示
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 身分証有効期限 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">身分証有効期限</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingExpiry ? (
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  className="px-3 py-2 border rounded-md text-sm"
                  value={editExpiryValue}
                  onChange={(e) => setEditExpiryValue(e.target.value)}
                />
                <Button size="sm" onClick={handleSaveExpiry}>
                  保存
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingExpiry(false)}>
                  キャンセル
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm mb-2">
                  {application.latestExpiryDate
                    ? formatDate(application.latestExpiryDate)
                    : "未設定"}
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditExpiryValue(
                      application.latestExpiryDate
                        ? new Date(application.latestExpiryDate).toISOString().split("T")[0]
                        : ""
                    );
                    setIsEditingExpiry(true);
                  }}
                >
                  編集
                </Button>
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
                  {application.lines.length}回線（未割当: {notActivatedCount}）
                </span>
              </CardTitle>
              {notActivatedCount > 0 && (
                <Button onClick={() => setShowScanModal(true)}>
                  <ScanLine className="h-4 w-4 mr-2" />
                  ICCID連続入力
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* 一括編集バー */}
            {selectedLines.size > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-blue-700">
                  {selectedLines.size}件選択中
                </span>
                <select
                  className="px-2 py-1 border rounded text-xs"
                  value={bulkLineTagId}
                  onChange={(e) => setBulkLineTagId(e.target.value)}
                >
                  <option value="">回線タグ</option>
                  <option value="clear">クリア</option>
                  {lineTags.map((tag) => (
                    <option key={tag.id} value={tag.id.toString()}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <select
                  className="px-2 py-1 border rounded text-xs"
                  value={bulkLineReserveTagId}
                  onChange={(e) => setBulkLineReserveTagId(e.target.value)}
                >
                  <option value="">予備タグ</option>
                  <option value="clear">クリア</option>
                  {lineReserveTags.map((tag) => (
                    <option key={tag.id} value={tag.id.toString()}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  className="px-2 py-1 border rounded text-xs"
                  value={bulkShippedAt}
                  onChange={(e) => setBulkShippedAt(e.target.value)}
                  placeholder="発送日"
                />
                <input
                  type="date"
                  className="px-2 py-1 border rounded text-xs"
                  value={bulkReturnedAt}
                  onChange={(e) => setBulkReturnedAt(e.target.value)}
                  placeholder="返却日"
                />
                <input
                  type="month"
                  className="px-2 py-1 border rounded text-xs"
                  value={bulkContractMonth}
                  onChange={(e) => setBulkContractMonth(e.target.value)}
                  placeholder="契約月"
                />
                <Button
                  size="sm"
                  onClick={applyBulkUpdate}
                  disabled={!bulkLineTagId && !bulkLineReserveTagId && !bulkShippedAt && !bulkReturnedAt && !bulkContractMonth}
                >
                  適用
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedLines(new Set())}
                >
                  解除
                </Button>
              </div>
            )}
            {/* 変更保存バー */}
            {hasChanges() && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-yellow-700">
                  未保存の変更があります（{getChangedLinesCount()}件）
                </span>
                {hasValidationErrors() && (
                  <span className="text-sm text-red-600">
                    （入力エラーがあります）
                  </span>
                )}
                <Button
                  size="sm"
                  onClick={handleSaveAll}
                  disabled={isSaving || hasValidationErrors()}
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "保存"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelAll}
                >
                  キャンセル
                </Button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-2 w-8">
                      <input
                        type="checkbox"
                        checked={
                          application.lines.length > 0 &&
                          selectedLines.size === application.lines.length
                        }
                        onChange={toggleAllLines}
                        disabled={application.lines.length === 0}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left py-2 px-2 whitespace-nowrap min-w-[30px]">#</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap min-w-[100px]">電話番号</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap min-w-[150px]">ICCID</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap min-w-[90px]">SIMの場所</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap min-w-[90px]">回線タグ</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap min-w-[90px]">予備タグ</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap min-w-[100px]">発送日</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap min-w-[100px]">返却日</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap min-w-[100px]">契約月</th>
                    <th className="text-left py-2 px-2 whitespace-nowrap min-w-[90px]">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {application.lines.map((line) => {
                    const currentSimId = getCurrentValue(line.id, "simId", line.simId);
                    const currentSimLocationTagId = getCurrentValue(
                      line.id,
                      "simLocationTagId",
                      line.sim?.simLocationTag?.id ?? null
                    );
                    const currentLineTagId = getCurrentValue(
                      line.id,
                      "lineTagId",
                      line.lineTag?.id ?? null
                    );
                    const currentLineReserveTagId = getCurrentValue(
                      line.id,
                      "lineReserveTagId",
                      line.lineReserveTag?.id ?? null
                    );
                    const currentShippedAt = getCurrentValue(line.id, "shippedAt", line.shippedAt);
                    const currentReturnedAt = getCurrentValue(line.id, "returnedAt", line.returnedAt);
                    const currentContractMonth = getCurrentValue(line.id, "contractMonth", line.contractMonth);
                    const currentStatus = getCurrentValue(line.id, "status", line.status);

                    return (
                      <tr
                        key={line.id}
                        className={`border-b hover:bg-gray-50 ${
                          hasLineChanges(line.id) ? "bg-yellow-50" : ""
                        }`}
                      >
                        <td className="py-2 px-2">
                          <input
                            type="checkbox"
                            checked={selectedLines.has(line.id)}
                            onChange={() => toggleLineSelection(line.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="py-2 px-2">{line.lineNumber}</td>
                        <td className="py-2 px-2">{line.msisdn || "—"}</td>
                        <td className="py-2 px-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                className={`px-2 py-1 border rounded text-xs font-mono w-[140px] ${
                                  iccidErrors[line.id] ? "border-red-500 bg-red-50" : ""
                                }`}
                                value={currentSimId ?? ""}
                                placeholder="ICCID"
                                maxLength={20}
                                onChange={(e) => handleIccidChange(line.id, e.target.value)}
                              />
                              {currentSimId && (
                                <Link
                                  href={`/sims/${currentSimId}`}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="SIM詳細"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              )}
                            </div>
                            {iccidErrors[line.id] && (
                              <span className="text-xs text-red-500">{iccidErrors[line.id]}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          {(line.sim || currentSimId) ? (
                            <select
                              className="px-2 py-1 border rounded text-xs min-w-[80px]"
                              value={currentSimLocationTagId?.toString() || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                handleLineChange(
                                  line.id,
                                  "simLocationTagId",
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
                            value={currentLineTagId?.toString() || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleLineChange(
                                line.id,
                                "lineTagId",
                                value ? parseInt(value) : null
                              );
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
                            value={currentLineReserveTagId?.toString() || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleLineChange(
                                line.id,
                                "lineReserveTagId",
                                value ? parseInt(value) : null
                              );
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
                            value={currentShippedAt ? String(currentShippedAt).split("T")[0] : ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleLineChange(
                                line.id,
                                "shippedAt",
                                value ? value : null
                              );
                              if (value) {
                                handleLineChange(line.id, "status", "SHIPPED");
                              }
                            }}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="date"
                            className="px-2 py-1 border rounded text-xs"
                            value={currentReturnedAt ? String(currentReturnedAt).split("T")[0] : ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleLineChange(
                                line.id,
                                "returnedAt",
                                value ? value : null
                              );
                              if (value) {
                                handleLineChange(line.id, "status", "RETURNED");
                              }
                            }}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="month"
                            className="px-2 py-1 border rounded text-xs"
                            value={currentContractMonth ? formatMonth(String(currentContractMonth)) : ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleLineChange(
                                line.id,
                                "contractMonth",
                                value ? value + "-01" : null
                              );
                            }}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            className="px-2 py-1 border rounded text-xs"
                            value={currentStatus || ""}
                            onChange={(e) => {
                              handleLineChange(line.id, "status", e.target.value);
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
                    );
                  })}
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
          notActivatedCount={notActivatedCount}
          lineTags={lineTags}
          lineReserveTags={lineReserveTags}
          onClose={() => setShowScanModal(false)}
          onComplete={() => {
            setShowScanModal(false);
            fetchApplication();
          }}
        />
      )}

      {/* KycModal */}
      <KycModal
        applicationId={application?.id || null}
        isOpen={isKycModalOpen}
        onClose={() => {
          setIsKycModalOpen(false);
          setKycModalInitialType(undefined);
        }}
        initialImageType={kycModalInitialType}
      />

      {/* アーカイブ確認ダイアログ */}
      <Dialog open={isArchiveConfirmOpen} onOpenChange={setIsArchiveConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申し込みをアーカイブ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              この申し込みをアーカイブしますか？
            </p>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                アーカイブすると、この申し込みと関連する全ての回線が一覧から非表示になります。
                総合回線管理・SIM管理でもアーカイブ状態として表示されます。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsArchiveConfirmOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleArchive}
              disabled={archiveProcessing}
            >
              {archiveProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              アーカイブする
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
