"use client";

import { useState, Suspense, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/api/query-keys";
import { api } from "@/lib/api/client";

interface Coupon {
  id: string;
  code: string;
  planId: string;
  unitPrice: number;
  description: string | null;
  maxUsages: number | null;
  usageCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  plan: {
    id: string;
    name: string;
    service: { id: string; code: string; name: string };
  };
  _count: { applications: number };
}

interface Plan {
  id: string;
  name: string;
  serviceId: string;
  isActive: boolean;
  service: { id: string; code: string; name: string };
}

interface Service {
  id: string;
  name: string;
  code: string;
}

interface CouponsWithRelations {
  services: Service[];
  plans: Plan[];
  coupons: Coupon[];
}

function CouponsContent() {
  const queryClient = useQueryClient();

  const [showInactive, setShowInactive] = useState(false);
  const [filterServiceId, setFilterServiceId] = useState<string>("");

  // 最適化: 1リクエストでcoupons, services, plansを取得
  const { data, isLoading: loading } = useQuery<CouponsWithRelations>({
    queryKey: queryKeys.couponsWithRelations,
    queryFn: api.getCouponsWithRelations as () => Promise<CouponsWithRelations>,
  });

  const services = data?.services ?? [];
  const plansData = data?.plans ?? [];
  const couponsData = data?.coupons ?? [];

  const coupons = useMemo(() => {
    let filtered = couponsData;
    if (!showInactive) {
      filtered = filtered.filter((c) => c.isActive);
    }
    if (filterServiceId) {
      filtered = filtered.filter((c) => c.plan.service.id === filterServiceId);
    }
    return filtered;
  }, [couponsData, showInactive, filterServiceId]);

  // モーダルのサービス選択に応じたプランフィルタ
  const [modalServiceId, setModalServiceId] = useState<string>("");
  const filteredPlans = useMemo(() => {
    if (!modalServiceId) return plansData.filter((p) => p.isActive);
    return plansData.filter((p) => p.serviceId === modalServiceId && p.isActive);
  }, [plansData, modalServiceId]);

  // モーダル状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    planId: "",
    unitPrice: 0,
    description: "",
    maxUsages: "" as string | number,
    validFrom: "",
    validUntil: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setModalServiceId("");
    setFormData({
      code: "",
      planId: "",
      unitPrice: 0,
      description: "",
      maxUsages: "",
      validFrom: "",
      validUntil: "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setModalServiceId(coupon.plan.service.id);
    setFormData({
      code: coupon.code,
      planId: coupon.planId,
      unitPrice: coupon.unitPrice,
      description: coupon.description || "",
      maxUsages: coupon.maxUsages ?? "",
      validFrom: coupon.validFrom.slice(0, 10),
      validUntil: coupon.validUntil.slice(0, 10),
    });
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingCoupon
        ? "/api/coupons/" + editingCoupon.id
        : "/api/coupons";
      const method = editingCoupon ? "PATCH" : "POST";

      const payload = {
        code: formData.code,
        planId: formData.planId,
        unitPrice: formData.unitPrice,
        description: formData.description || null,
        maxUsages: formData.maxUsages !== "" ? Number(formData.maxUsages) : null,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        closeModal();
        toast.success(editingCoupon ? "クーポンを更新しました" : "クーポンを作成しました");
        queryClient.invalidateQueries({ queryKey: queryKeys.coupons });
      } else {
        setError(data.error || "保存に失敗しました");
      }
    } catch (err) {
      console.error("保存エラー:", err);
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm("「" + coupon.code + "」を削除しますか？\n\n※利用済みの場合は無効化されます。")) {
      return;
    }

    try {
      const res = await fetch("/api/coupons/" + coupon.id, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("クーポンを削除しました");
        queryClient.invalidateQueries({ queryKey: queryKeys.coupons });
      } else {
        const data = await res.json();
        toast.error(data.error || "削除に失敗しました");
      }
    } catch (err) {
      console.error("削除エラー:", err);
      toast.error("削除に失敗しました");
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    queryClient.setQueryData<Coupon[]>(queryKeys.coupons, (old) => {
      if (!old) return old;
      return old.map((c) =>
        c.id === coupon.id ? { ...c, isActive: !c.isActive } : c
      );
    });

    try {
      const res = await fetch("/api/coupons/" + coupon.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });

      if (res.ok) {
        toast.success(coupon.isActive ? "クーポンを無効化しました" : "クーポンを有効化しました");
      } else {
        throw new Error("更新に失敗しました");
      }
    } catch (err) {
      console.error("ステータス変更エラー:", err);
      toast.error("ステータスの変更に失敗しました");
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons });
    }
  };

  const formatPrice = (price: number) => {
    return "¥" + price.toLocaleString();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ja-JP");
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">クーポン管理</h1>
      </div>

      <div className="max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <select
              value={filterServiceId}
              onChange={(e) => setFilterServiceId(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">全サービス</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded"
              />
              無効なクーポンも表示
            </label>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            新規クーポン作成
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              クーポン一覧
              <span className="text-sm font-normal text-gray-500 ml-2">
                {coupons.length}件
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coupons.length === 0 && !loading ? (
              <div className="text-center py-12 text-gray-500">
                クーポンが登録されていません
              </div>
            ) : coupons.length === 0 && loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">コード</th>
                    <th className="text-left py-2 px-4">プラン</th>
                    <th className="text-right py-2 px-4">クーポン単価</th>
                    <th className="text-left py-2 px-4">有効期間</th>
                    <th className="text-right py-2 px-4">利用数/上限</th>
                    <th className="text-left py-2 px-4">ステータス</th>
                    <th className="text-right py-2 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className={"border-b hover:bg-gray-50" + (!coupon.isActive ? " opacity-60" : "")}>
                      <td className="py-2 px-4 font-mono font-medium">{coupon.code}</td>
                      <td className="py-2 px-4">
                        <div>
                          <span className="font-medium">{coupon.plan.name}</span>
                          <Badge variant="outline" className="ml-2">{coupon.plan.service.name}</Badge>
                        </div>
                        {coupon.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{coupon.description}</p>
                        )}
                      </td>
                      <td className="py-2 px-4 text-right font-medium">
                        {formatPrice(coupon.unitPrice)}
                      </td>
                      <td className="py-2 px-4">
                        <div className="text-xs">
                          {formatDate(coupon.validFrom)} 〜 {formatDate(coupon.validUntil)}
                        </div>
                        {isExpired(coupon.validUntil) && (
                          <Badge variant="destructive" className="mt-0.5">期限切れ</Badge>
                        )}
                      </td>
                      <td className="py-2 px-4 text-right">
                        {coupon.usageCount} / {coupon.maxUsages ?? "∞"}
                      </td>
                      <td className="py-2 px-4">
                        <button onClick={() => toggleActive(coupon)}>
                          <Badge variant={coupon.isActive ? "success" : "secondary"}>
                            {coupon.isActive ? "有効" : "無効"}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(coupon)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(coupon)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingCoupon ? "クーポン編集" : "新規クーポン作成"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-2 rounded text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    クーポンコード
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-md font-mono"
                    placeholder="SUMMER2026"
                    required
                    maxLength={50}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      サービス
                    </label>
                    <select
                      value={modalServiceId}
                      onChange={(e) => {
                        setModalServiceId(e.target.value);
                        setFormData({ ...formData, planId: "" });
                      }}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      <option value="">選択してください</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      プラン
                    </label>
                    <select
                      value={formData.planId}
                      onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                      disabled={!modalServiceId}
                    >
                      <option value="">選択してください</option>
                      {filteredPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    クーポン適用後の単価（円/回線/月）
                  </label>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-md"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明（任意）
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="例: 夏季キャンペーン特別価格"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    利用回数上限（空欄=無制限）
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsages}
                    onChange={(e) => setFormData({ ...formData, maxUsages: e.target.value ? parseInt(e.target.value) : "" })}
                    className="w-full px-3 py-2 border rounded-md"
                    min="1"
                    placeholder="無制限"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      有効開始日
                    </label>
                    <input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      有効終了日
                    </label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
                <Button type="button" variant="outline" onClick={closeModal}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "保存"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CouponsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <CouponsContent />
    </Suspense>
  );
}
