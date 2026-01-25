"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, X } from "lucide-react";

interface UsageTag {
  id: number;
  code: string;
  name: string;
}

interface UsageRule {
  id: number;
  usageTagId: number;
  usageTag: UsageTag;
  supplierFilter: string | null;
  carrierFilter: string | null;
  planFilter: string | null;
  excludedTagIds: number[];
  excludedTags: UsageTag[];
  minContractDays: number;
  requiresMnp: boolean;
  priority: number;
  isActive: boolean;
}

const CARRIER_LABELS: Record<string, string> = {
  DOCOMO: "docomo",
  AU: "au",
  SOFTBANK: "SoftBank",
  RAKUTEN: "楽天",
};

export default function RulesPage() {
  const [rules, setRules] = useState<UsageRule[]>([]);
  const [usageTags, setUsageTags] = useState<UsageTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  // モーダル状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<UsageRule | null>(null);
  const [formData, setFormData] = useState({
    usageTagId: 0,
    supplierFilter: "",
    carrierFilter: "",
    excludedTagIds: [] as number[],
    minContractDays: 0,
    requiresMnp: false,
    priority: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showInactive) params.set("includeInactive", "true");

      const res = await fetch(`/api/usage-rules?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setRules(data);
      }
    } catch (err) {
      console.error("販売ルール取得エラー:", err);
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
    fetchRules();
    fetchUsageTags();
  }, [showInactive]);

  const openCreateModal = () => {
    if (usageTags.length === 0) {
      alert("先に用途タグを作成してください");
      return;
    }
    setEditingRule(null);
    setFormData({
      usageTagId: usageTags[0].id,
      supplierFilter: "",
      carrierFilter: "",
      excludedTagIds: [],
      minContractDays: 0,
      requiresMnp: false,
      priority: 0,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: UsageRule) => {
    setEditingRule(rule);
    setFormData({
      usageTagId: rule.usageTagId,
      supplierFilter: rule.supplierFilter || "",
      carrierFilter: rule.carrierFilter || "",
      excludedTagIds: rule.excludedTagIds,
      minContractDays: rule.minContractDays,
      requiresMnp: rule.requiresMnp,
      priority: rule.priority,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingRule
        ? `/api/usage-rules/${editingRule.id}`
        : "/api/usage-rules";
      const method = editingRule ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          supplierFilter: formData.supplierFilter || null,
          carrierFilter: formData.carrierFilter || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        closeModal();
        fetchRules();
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

  const handleDelete = async (rule: UsageRule) => {
    if (!confirm(`このルールを削除しますか？`)) {
      return;
    }

    try {
      const res = await fetch(`/api/usage-rules/${rule.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchRules();
      } else {
        const data = await res.json();
        alert(data.error || "削除に失敗しました");
      }
    } catch (err) {
      console.error("削除エラー:", err);
      alert("削除に失敗しました");
    }
  };

  const toggleActive = async (rule: UsageRule) => {
    try {
      const res = await fetch(`/api/usage-rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });

      if (res.ok) {
        fetchRules();
      }
    } catch (err) {
      console.error("ステータス変更エラー:", err);
    }
  };

  const handleExcludedTagToggle = (tagId: number) => {
    setFormData((prev) => ({
      ...prev,
      excludedTagIds: prev.excludedTagIds.includes(tagId)
        ? prev.excludedTagIds.filter((id) => id !== tagId)
        : [...prev.excludedTagIds, tagId],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">販売ルール管理</h1>
              <p className="text-sm text-gray-500 mt-1">
                SIMの販売可否判定ルールを設定
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            無効なルールも表示
          </label>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            新規ルール作成
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              販売ルール一覧
              <span className="text-sm font-normal text-gray-500 ml-2">
                {rules.length}件
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                販売ルールが登録されていません
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">優先度</th>
                      <th className="text-left py-3 px-4">用途タグ</th>
                      <th className="text-left py-3 px-4">仕入れ先</th>
                      <th className="text-left py-3 px-4">キャリア</th>
                      <th className="text-left py-3 px-4">排他タグ</th>
                      <th className="text-left py-3 px-4">MNP</th>
                      <th className="text-left py-3 px-4">最低日数</th>
                      <th className="text-left py-3 px-4">状態</th>
                      <th className="text-right py-3 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{rule.priority}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">{rule.usageTag.name}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          {rule.supplierFilter || "全て"}
                        </td>
                        <td className="py-3 px-4">
                          {rule.carrierFilter
                            ? CARRIER_LABELS[rule.carrierFilter] || rule.carrierFilter
                            : "全て"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {rule.excludedTags.length > 0 ? (
                              rule.excludedTags.map((tag) => (
                                <Badge key={tag.id} variant="outline" className="text-xs">
                                  {tag.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {rule.requiresMnp ? (
                            <Badge variant="success">必須</Badge>
                          ) : (
                            <span className="text-gray-400">不要</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {rule.minContractDays > 0
                            ? `${rule.minContractDays}日`
                            : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={() => toggleActive(rule)}>
                            <Badge variant={rule.isActive ? "success" : "secondary"}>
                              {rule.isActive ? "有効" : "無効"}
                            </Badge>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(rule)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(rule)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">ルールの評価順序</h4>
              <p className="text-sm text-blue-700">
                SIMが特定の用途タグで販売可能かどうかは、優先度の高い順にルールを評価します。
                SIMがルールの条件（仕入れ先、キャリア、排他タグなし、MNP可否、最低契約日数）を
                全て満たす場合、そのタグで販売可能と判定されます。
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">
                {editingRule ? "販売ルール編集" : "新規販売ルール作成"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-2 rounded text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    用途タグ
                  </label>
                  <select
                    value={formData.usageTagId}
                    onChange={(e) =>
                      setFormData({ ...formData, usageTagId: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    {usageTags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    仕入れ先フィルタ（空欄で全て）
                  </label>
                  <input
                    type="text"
                    value={formData.supplierFilter}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierFilter: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="arts"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    キャリアフィルタ
                  </label>
                  <select
                    value={formData.carrierFilter}
                    onChange={(e) =>
                      setFormData({ ...formData, carrierFilter: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">全て</option>
                    <option value="DOCOMO">docomo</option>
                    <option value="AU">au</option>
                    <option value="SOFTBANK">SoftBank</option>
                    <option value="RAKUTEN">楽天</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    排他タグ（選択したタグが消費済みの場合は販売不可）
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-gray-50">
                    {usageTags
                      .filter((tag) => tag.id !== formData.usageTagId)
                      .map((tag) => (
                        <label
                          key={tag.id}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.excludedTagIds.includes(tag.id)}
                            onChange={() => handleExcludedTagToggle(tag.id)}
                            className="rounded"
                          />
                          <Badge variant="outline">{tag.name}</Badge>
                        </label>
                      ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最低契約日数
                    </label>
                    <input
                      type="number"
                      value={formData.minContractDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minContractDays: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      優先度
                    </label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiresMnp}
                      onChange={(e) =>
                        setFormData({ ...formData, requiresMnp: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      MNP必須
                    </span>
                  </label>
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
