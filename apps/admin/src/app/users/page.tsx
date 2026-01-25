"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, X, Eye, EyeOff } from "lucide-react";

interface Service {
  id: string;
  code: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
  serviceId: string | null;
  service: Service | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    customers: number;
  };
}

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "顧客",
  ADMIN: "管理者",
  SUPER_ADMIN: "スーパー管理者",
};

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  CUSTOMER: "secondary",
  ADMIN: "default",
  SUPER_ADMIN: "warning",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterServiceId, setFilterServiceId] = useState<string>("");

  // モーダル状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "CUSTOMER" as "CUSTOMER" | "ADMIN" | "SUPER_ADMIN",
    serviceId: "" as string | null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showInactive) params.set("includeInactive", "true");
      if (filterRole) params.set("role", filterRole);
      if (filterServiceId) params.set("serviceId", filterServiceId);

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      }
    } catch (err) {
      console.error("ユーザー取得エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      if (res.ok) {
        setServices(data);
      }
    } catch (err) {
      console.error("サービス取得エラー:", err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [showInactive, filterRole, filterServiceId]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      role: "CUSTOMER",
      serviceId: null,
    });
    setShowPassword(false);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      role: user.role,
      serviceId: user.serviceId,
    });
    setShowPassword(false);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingUser
        ? `/api/users/${editingUser.id}`
        : "/api/users";
      const method = editingUser ? "PATCH" : "POST";

      const payload: Record<string, unknown> = {
        email: formData.email,
        role: formData.role,
        serviceId: formData.serviceId || null,
      };

      // 新規作成時はパスワード必須、編集時は入力があった場合のみ
      if (!editingUser) {
        if (!formData.password) {
          setError("パスワードを入力してください");
          setSaving(false);
          return;
        }
        payload.password = formData.password;
      } else if (formData.password) {
        payload.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        closeModal();
        fetchUsers();
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

  const handleDelete = async (user: User) => {
    if (!confirm(`「${user.email}」を削除しますか？\n\n※顧客が紐付いている場合は無効化されます。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "削除に失敗しました");
      }
    } catch (err) {
      console.error("削除エラー:", err);
      alert("削除に失敗しました");
    }
  };

  const toggleActive = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (res.ok) {
        fetchUsers();
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
              <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
              <p className="text-sm text-gray-500 mt-1">
                管理者・顧客ユーザーを管理
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">全ロール</option>
              <option value="SUPER_ADMIN">スーパー管理者</option>
              <option value="ADMIN">管理者</option>
              <option value="CUSTOMER">顧客</option>
            </select>
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
              無効ユーザーも表示
            </label>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            新規ユーザー作成
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              ユーザー一覧
              <span className="text-sm font-normal text-gray-500 ml-2">
                {users.length}件
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                ユーザーが登録されていません
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">メールアドレス</th>
                      <th className="text-left py-3 px-4">ロール</th>
                      <th className="text-left py-3 px-4">サービス</th>
                      <th className="text-left py-3 px-4">顧客数</th>
                      <th className="text-left py-3 px-4">状態</th>
                      <th className="text-right py-3 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-b hover:bg-gray-50 ${!user.isActive ? "opacity-60" : ""}`}
                      >
                        <td className="py-3 px-4 font-medium">{user.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant={ROLE_VARIANTS[user.role]}>
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {user.service ? (
                            <Badge variant="outline">{user.service.name}</Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {user._count.customers > 0 ? (
                            `${user._count.customers}件`
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={() => toggleActive(user)}>
                            <Badge variant={user.isActive ? "success" : "secondary"}>
                              {user.isActive ? "有効" : "無効"}
                            </Badge>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user)}
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
          </CardContent>
        </Card>
      </main>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingUser ? "ユーザー編集" : "新規ユーザー作成"}
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
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード
                    {editingUser && (
                      <span className="text-gray-400 font-normal ml-2">
                        （変更する場合のみ入力）
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md pr-10"
                      minLength={8}
                      required={!editingUser}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">8文字以上</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ロール
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as "CUSTOMER" | "ADMIN" | "SUPER_ADMIN",
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="CUSTOMER">顧客</option>
                    <option value="ADMIN">管理者</option>
                    <option value="SUPER_ADMIN">スーパー管理者</option>
                  </select>
                </div>
                {(formData.role === "ADMIN" || formData.role === "SUPER_ADMIN") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      所属サービス
                      {formData.role === "SUPER_ADMIN" && (
                        <span className="text-gray-400 font-normal ml-2">
                          （スーパー管理者は全サービス管理可）
                        </span>
                      )}
                    </label>
                    <select
                      value={formData.serviceId || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          serviceId: e.target.value || null,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">未設定</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
