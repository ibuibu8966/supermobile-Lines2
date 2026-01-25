import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import {
  Smartphone,
  Tags,
  Settings,
  RefreshCw,
  Building2,
  Package,
} from "lucide-react";

const menuItems = [
  {
    title: "SIM一覧",
    description: "SIMカードの一覧表示・検索・詳細確認",
    href: "/sims",
    icon: Smartphone,
  },
  {
    title: "仕入れ先管理",
    description: "SIM仕入れ先の登録・編集",
    href: "/suppliers",
    icon: Building2,
  },
  {
    title: "用途タグ管理",
    description: "販売用途タグの登録・編集",
    href: "/usage-tags",
    icon: Tags,
  },
  {
    title: "販売ルール管理",
    description: "販売可能判定ルールの設定",
    href: "/rules",
    icon: Settings,
  },
  {
    title: "サービス・プラン管理",
    description: "サービスとプランの登録・編集",
    href: "/services",
    icon: Package,
  },
  {
    title: "外部連携・同期",
    description: "外部サービスとのデータ同期",
    href: "/sync",
    icon: RefreshCw,
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            スーパー回線管理くん
          </h1>
          <p className="text-sm text-gray-500 mt-1">SIM統合管理システム</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SIM在庫</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">利用可能なSIM</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">利用中</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">アクティブな契約</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">返却待ち</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">返却予定のSIM</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
