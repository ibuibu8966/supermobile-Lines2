"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, X } from "lucide-react";

interface SimLocationTag {
  id: number;
  code: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  _count: {
    sims: number;
  };
}

export default function SimLocationTagsPage() {
  const [tags, setTags] = useState<SimLocationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  // モーダル状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<SimLocationTag | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    displayOrder: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showInactive) params.set("includeInactive", "true");

      const res = await fetch(`/api/sim-location-tags?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setTags(data);
      }
    } catch (err) {
      console.error("SIMの場所タグ取得エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [showInactive]);

  const openCreateModal = () => {
    setEditingTag(null);
    setFormData({
      code: "",
      name: "",
      displayOrder: tags.length,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tag: SimLocationTag) => {
    setEditingTag(tag);
    setFormData({
      code: tag.code,
      name: tag.name,
      displayOrder: tag.displayOrder,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTag(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingTag
        ? `/api/sim-location-tags/${editingTag.id}`
        : "/api/sim-location-tags";
      const method = editingTag ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        closeModal();
        fetchTags();
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

  const handleDelete = async (tag: SimLocationTag) => {
    if (!confirm(`「${tag.name}」を削除しますか？\n\n※使用中の場合は無効化されます。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/sim-location-tags/${tag.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchTags();
      } else {
        const data = await res.json();
        alert(data.error || "削除に失敗しました");
      }
    } catch (err) {
      console.error("削除エラー:", err);
      alert("削除に失敗しました");
    }
  };

  const toggleActive = async (tag: SimLocationTag) => {
    try {
      const res = await fetch(`/api/sim-location-tags/${tag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tag.isActive }),
      });

      if (res.ok) {
        fetchTags();
      }
    } catch (err) {
      console.error("ステータス変更エラー:", err);
    }
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
              <h1 className="text-2xl font-bold text-gray-900">SIMの場所管理</h1>
              <p className="text-sm text-gray-500 mt-1">
                SIMの保管場所タグを管理
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            無効なタグも表示
          </label>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              SIMの場所一覧
              <span className="text-sm font-normal text-gray-500 ml-2">
                {tags.length}件
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : tags.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                SIMの場所タグが登録されていません
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">コード</th>
                    <th className="text-left py-2 px-4">表示名</th>
                    <th className="text-left py-2 px-4">使用数</th>
                    <th className="text-left py-2 px-4">ステータス</th>
                    <th className="text-right py-2 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map((tag) => (
                    <tr key={tag.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 font-mono text-xs">{tag.code}</td>
                      <td className="py-2 px-4">
                        <Badge variant="secondary">{tag.name}</Badge>
                      </td>
                      <td className="py-2 px-4 text-gray-500 text-xs">
                        {tag._count.sims}件
                      </td>
                      <td className="py-2 px-4">
                        <button onClick={() => toggleActive(tag)}>
                          <Badge variant={tag.isActive ? "success" : "secondary"}>
                            {tag.isActive ? "有効" : "無効"}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(tag)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(tag)}
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
      </main>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingTag ? "SIMの場所編集" : "新規SIMの場所作成"}
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
                    コード
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="warehouse_a"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    表示名
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="倉庫A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    表示順
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
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
