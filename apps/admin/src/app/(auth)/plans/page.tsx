"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api";

interface PlanPricing {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
  description: string | null;
}

interface Plan {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  serviceId: string;
  service: { id: string; code: string; name: string };
  usageTags: Array<{ usageTag: { id: number; code: string; name: string } }>;
  pricings: PlanPricing[];
  _count: { applications: number };
}

interface PricingInput {
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
  description: string;
}

function PlansContent() {
  const searchParams = useSearchParams();
  const serviceIdParam = searchParams.get("serviceId");
  const queryClient = useQueryClient();

  const [showInactive, setShowInactive] = useState(false);
  const [filterServiceId, setFilterServiceId] = useState<string>(serviceIdParam || "");

  // TanStack Query
  const { data: services = [] } = useQuery<{ id: string; code: string; name: string }[]>({
    queryKey: queryKeys.services,
    queryFn: api.getServices,
  });

  const { data: usageTags = [] } = useQuery<{ id: number; code: string; name: string }[]>({
    queryKey: queryKeys.usageTags,
    queryFn: api.getUsageTags,
  });

  const { data: plansData = [], isLoading: loading } = useQuery<Plan[]>({
    queryKey: queryKeys.plans,
    queryFn: api.getPlans,
  });

  // フィルター適用
  const plans = useMemo(() => {
    let filtered = plansData;
    if (!showInactive) {
      filtered = filtered.filter((p) => p.isActive);
    }
    if (filterServiceId) {
      filtered = filtered.filter((p) => p.serviceId === filterServiceId);
    }
    return filtered;
  }, [plansData, showInactive, filterServiceId]);

  // モーダル状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    serviceId: "",
    code: "",
    name: "",
    usageTagIds: [] as number[],
    pricings: [] as PricingInput[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      serviceId: filterServiceId || "",
      code: "",
      name: "",
      usageTagIds: [],
      pricings: [
        { minQuantity: 1, maxQuantity: null, unitPrice: 0, description: "" },
      ],
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      serviceId: plan.serviceId,
      code: plan.code,
      name: plan.name,
      usageTagIds: plan.usageTags.map((pt) => pt.usageTag.id),
      pricings: plan.pricings.map((p) => ({
        minQuantity: p.minQuantity,
        maxQuantity: p.maxQuantity,
        unitPrice: p.unitPrice,
        description: p.description || "",
      })),
    });
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingPlan
        ? "/api/plans/" + editingPlan.id
        : "/api/plans";
      const method = editingPlan ? "PATCH" : "POST";

      const payload = {
        ...formData,
        pricings: formData.pricings.map((p) => ({
          ...p,
          description: p.description || null,
        })),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        closeModal();
        toast.success(editingPlan ? "プランを更新しました" : "プランを作成しました");
        queryClient.invalidateQueries({ queryKey: queryKeys.plans });
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

  const handleDelete = async (plan: Plan) => {
    if (!confirm("「" + plan.name + "」を削除しますか？\n\n※申込がある場合は無効化されます。")) {
      return;
    }

    try {
      const res = await fetch("/api/plans/" + plan.id, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("プランを削除しました");
        queryClient.invalidateQueries({ queryKey: queryKeys.plans });
      } else {
        const data = await res.json();
        toast.error(data.error || "削除に失敗しました");
      }
    } catch (err) {
      console.error("削除エラー:", err);
      toast.error("削除に失敗しました");
    }
  };

  const toggleActive = async (plan: Plan) => {
    // 楽観的更新
    queryClient.setQueryData<Plan[]>(queryKeys.plans, (old) => {
      if (!old) return old;
      return old.map((p) =>
        p.id === plan.id ? { ...p, isActive: !p.isActive } : p
      );
    });

    try {
      const res = await fetch("/api/plans/" + plan.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });

      if (res.ok) {
        toast.success(plan.isActive ? "プランを無効化しました" : "プランを有効化しました");
      } else {
        throw new Error("更新に失敗しました");
      }
    } catch (err) {
      console.error("ステータス変更エラー:", err);
      toast.error("ステータスの変更に失敗しました");
      queryClient.invalidateQueries({ queryKey: queryKeys.plans });
    }
  };

  const addPricing = () => {
    setFormData({
      ...formData,
      pricings: [
        ...formData.pricings,
        { minQuantity: 1, maxQuantity: null, unitPrice: 0, description: "" },
      ],
    });
  };

  const removePricing = (index: number) => {
    setFormData({
      ...formData,
      pricings: formData.pricings.filter((_, i) => i !== index),
    });
  };

  const updatePricing = (index: number, field: keyof PricingInput, value: unknown) => {
    const newPricings = [...formData.pricings];
    newPricings[index] = { ...newPricings[index], [field]: value };
    setFormData({ ...formData, pricings: newPricings });
  };

  const formatPrice = (price: number) => {
    return "¥" + price.toLocaleString();
  };

  const getPriceDisplay = (pricings: PlanPricing[]) => {
    if (pricings.length === 0) return "-";

    const sorted = [...pricings].sort((a, b) => a.minQuantity - b.minQuantity);

    return sorted.map((p, i) => {
      const rangeText = p.maxQuantity
        ? `${p.minQuantity}〜${p.maxQuantity}回線`
        : `${p.minQuantity}回線以上`;
      return (
        <div key={i} className="text-xs">
          <span className="text-gray-500">{rangeText}:</span> {formatPrice(p.unitPrice)}
        </div>
      );
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">プラン管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          各サービスのプランを管理
        </p>
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
              無効なプランも表示
            </label>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            新規プラン作成
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              プラン一覧
              <span className="text-sm font-normal text-gray-500 ml-2">
                {plans.length}件
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plans.length === 0 && !loading ? (
              <div className="text-center py-12 text-gray-500">
                プランが登録されていません
              </div>
            ) : plans.length === 0 && loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">サービス</th>
                    <th className="text-left py-2 px-4">プラン名</th>
                    <th className="text-left py-2 px-4">コード</th>
                    <th className="text-left py-2 px-4">用途タグ</th>
                    <th className="text-left py-2 px-4">料金</th>
                    <th className="text-left py-2 px-4">ステータス</th>
                    <th className="text-right py-2 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className={"border-b hover:bg-gray-50" + (!plan.isActive ? " opacity-60" : "")}>
                      <td className="py-2 px-4">
                        <Badge variant="outline">{plan.service.name}</Badge>
                      </td>
                      <td className="py-2 px-4 font-medium">{plan.name}</td>
                      <td className="py-2 px-4 font-mono text-xs">{plan.code}</td>
                      <td className="py-2 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {plan.usageTags.length > 0 ? (
                            plan.usageTags.map((pt) => (
                              <Badge key={pt.usageTag.id} variant="secondary">
                                {pt.usageTag.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        {getPriceDisplay(plan.pricings)}
                      </td>
                      <td className="py-2 px-4">
                        <button onClick={() => toggleActive(plan)}>
                          <Badge variant={plan.isActive ? "success" : "secondary"}>
                            {plan.isActive ? "有効" : "無効"}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(plan)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(plan)}
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingPlan ? "プラン編集" : "新規プラン作成"}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      サービス
                    </label>
                    <select
                      value={formData.serviceId}
                      onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                      disabled={!!editingPlan}
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
                      コード
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="adaafi"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    プラン名
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="アダアフィプラン"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    用途タグ
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                    {usageTags.map((tag) => (
                      <label key={tag.id} className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.usageTagIds.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                usageTagIds: [...formData.usageTagIds, tag.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                usageTagIds: formData.usageTagIds.filter((id) => id !== tag.id),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        {tag.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      料金設定
                    </label>
                    <Button type="button" variant="outline" size="sm" onClick={addPricing}>
                      <Plus className="h-4 w-4 mr-1" />
                      追加
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {formData.pricings.map((pricing, index) => (
                      <div key={index} className="p-3 border rounded-md bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">料金 {index + 1}</span>
                          {formData.pricings.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePricing(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">最低回線数</label>
                            <input
                              type="number"
                              value={pricing.minQuantity}
                              onChange={(e) => updatePricing(index, "minQuantity", parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1 border rounded text-sm"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">最大回線数（空白=上限なし）</label>
                            <input
                              type="number"
                              value={pricing.maxQuantity || ""}
                              onChange={(e) => updatePricing(index, "maxQuantity", e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-2 py-1 border rounded text-sm"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">単価（円/月）</label>
                            <input
                              type="number"
                              value={pricing.unitPrice}
                              onChange={(e) => updatePricing(index, "unitPrice", parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border rounded text-sm"
                              min="0"
                            />
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="block text-xs text-gray-500 mb-1">説明</label>
                          <input
                            type="text"
                            value={pricing.description}
                            onChange={(e) => updatePricing(index, "description", e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                            placeholder="例: 51回線以上で10%OFF"
                          />
                        </div>
                      </div>
                    ))}
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

export default function PlansPage() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <PlansContent />
    </Suspense>
  );
}
