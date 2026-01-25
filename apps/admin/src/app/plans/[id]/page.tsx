"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { ArrowLeft, Pencil, Trash2, Loader2, X, Plus, Save } from "lucide-react";

interface UsageTag {
  id: number;
  code: string;
  name: string;
}

interface PlanUsageTag {
  usageTag: UsageTag;
}

interface PlanPricing {
  id: string;
  customerType: "INDIVIDUAL" | "CORPORATE";
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
  description: string | null;
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
  isActive: boolean;
  serviceId: string;
  service: Service;
  usageTags: PlanUsageTag[];
  pricings: PlanPricing[];
  _count: {
    applications: number;
  };
}

interface PricingInput {
  customerType: "INDIVIDUAL" | "CORPORATE";
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
  description: string;
}

export default function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [usageTags, setUsageTags] = useState<UsageTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // 編集フォーム状態
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    usageTagIds: [] as number[],
    pricings: [] as PricingInput[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/plans/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
        setFormData({
          code: data.code,
          name: data.name,
          usageTagIds: data.usageTags.map((pt: PlanUsageTag) => pt.usageTag.id),
          pricings: data.pricings.map((p: PlanPricing) => ({
            customerType: p.customerType,
            minQuantity: p.minQuantity,
            maxQuantity: p.maxQuantity,
            unitPrice: p.unitPrice,
            description: p.description || "",
          })),
        });
      } else if (res.status === 404) {
        router.push("/plans");
      }
    } catch (err) {
      console.error("プラン取得エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageTags = async () => {
    try {
      const res = await fetch("/api/usage-tags");
      const data = await res.json();
      if (res.ok) {
        setUsageTags(data);
      }
    } catch (err) {
      console.error("用途タグ取得エラー:", err);
    }
  };

  useEffect(() => {
    fetchPlan();
    fetchUsageTags();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        pricings: formData.pricings.map((p) => ({
          ...p,
          description: p.description || null,
        })),
      };

      const res = await fetch(`/api/plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setPlan(data);
        setIsEditing(false);
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

  const handleDelete = async () => {
    if (!plan) return;
    if (!confirm(`「${plan.name}」を削除しますか？\n\n※申込がある場合は無効化されます。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/plans/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/plans");
      } else {
        const data = await res.json();
        alert(data.error || "削除に失敗しました");
      }
    } catch (err) {
      console.error("削除エラー:", err);
      alert("削除に失敗しました");
    }
  };

  const toggleActive = async () => {
    if (!plan) return;
    try {
      const res = await fetch(`/api/plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });

      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      }
    } catch (err) {
      console.error("ステータス変更エラー:", err);
    }
  };

  const cancelEdit = () => {
    if (plan) {
      setFormData({
        code: plan.code,
        name: plan.name,
        usageTagIds: plan.usageTags.map((pt) => pt.usageTag.id),
        pricings: plan.pricings.map((p) => ({
          customerType: p.customerType,
          minQuantity: p.minQuantity,
          maxQuantity: p.maxQuantity,
          unitPrice: p.unitPrice,
          description: p.description || "",
        })),
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const addPricing = () => {
    setFormData({
      ...formData,
      pricings: [
        ...formData.pricings,
        { customerType: "INDIVIDUAL", minQuantity: 1, maxQuantity: null, unitPrice: 0, description: "" },
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">プランが見つかりません</p>
          <Link href="/plans">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              一覧に戻る
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/plans" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
                  <Badge variant={plan.isActive ? "success" : "secondary"}>
                    {plan.isActive ? "有効" : "無効"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {plan.service.name} / {plan.code}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <Button variant="outline" onClick={toggleActive}>
                    {plan.isActive ? "無効化" : "有効化"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    編集
                  </Button>
                  <Button variant="outline" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                    削除
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isEditing ? (
          <form onSubmit={handleSave}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">プラン編集</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-2 rounded text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      コード
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
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
                      required
                    />
                  </div>
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
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">顧客種別</label>
                            <select
                              value={pricing.customerType}
                              onChange={(e) => updatePricing(index, "customerType", e.target.value)}
                              className="w-full px-2 py-1 border rounded text-sm"
                            >
                              <option value="INDIVIDUAL">個人</option>
                              <option value="CORPORATE">法人</option>
                            </select>
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
                    {formData.pricings.length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        料金設定がありません。「追加」ボタンで追加してください。
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        保存
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        ) : (
          <div className="grid gap-6">
            {/* 基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">基本情報</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500">サービス</dt>
                    <dd className="font-medium mt-1">{plan.service.name}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">プランコード</dt>
                    <dd className="font-mono mt-1">{plan.code}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">プラン名</dt>
                    <dd className="font-medium mt-1">{plan.name}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">申込数</dt>
                    <dd className="font-medium mt-1">{plan._count.applications}件</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* 用途タグ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">用途タグ</CardTitle>
              </CardHeader>
              <CardContent>
                {plan.usageTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {plan.usageTags.map((pt) => (
                      <Badge key={pt.usageTag.id} variant="secondary">
                        {pt.usageTag.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">用途タグが設定されていません</p>
                )}
              </CardContent>
            </Card>

            {/* 料金テーブル */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">料金設定</CardTitle>
              </CardHeader>
              <CardContent>
                {plan.pricings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">顧客種別</th>
                          <th className="text-left py-2 px-4">回線数</th>
                          <th className="text-right py-2 px-4">単価</th>
                          <th className="text-left py-2 px-4">説明</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.pricings.map((pricing) => (
                          <tr key={pricing.id} className="border-b">
                            <td className="py-2 px-4">
                              <Badge variant="outline">
                                {pricing.customerType === "INDIVIDUAL" ? "個人" : "法人"}
                              </Badge>
                            </td>
                            <td className="py-2 px-4">
                              {pricing.maxQuantity
                                ? `${pricing.minQuantity}〜${pricing.maxQuantity}回線`
                                : `${pricing.minQuantity}回線以上`}
                            </td>
                            <td className="py-2 px-4 text-right font-medium">
                              {formatPrice(pricing.unitPrice)}/月
                            </td>
                            <td className="py-2 px-4 text-gray-500">
                              {pricing.description || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">料金設定がありません</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
