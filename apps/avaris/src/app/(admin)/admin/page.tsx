import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@repo/ui";
import { Users, FileText, CheckSquare, Package, Settings, LogOut } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-primary">avaris管理画面</h1>
            <Badge variant="secondary">ADMIN</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">管理者</span>
            <Button variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            <Link
              href="/admin"
              className="py-3 border-b-2 border-primary text-sm font-medium"
            >
              ダッシュボード
            </Link>
            <Link
              href="/admin/applications"
              className="py-3 border-b-2 border-transparent text-sm text-muted-foreground hover:text-foreground"
            >
              申込管理
            </Link>
            <Link
              href="/admin/lines"
              className="py-3 border-b-2 border-transparent text-sm text-muted-foreground hover:text-foreground"
            >
              回線管理
            </Link>
            <Link
              href="/admin/kyc"
              className="py-3 border-b-2 border-transparent text-sm text-muted-foreground hover:text-foreground"
            >
              KYC確認
            </Link>
            <Link
              href="/admin/shipping"
              className="py-3 border-b-2 border-transparent text-sm text-muted-foreground hover:text-foreground"
            >
              発送管理
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">ダッシュボード</h2>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                新規申込
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">本日の申込</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                KYC待ち
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-500">5</p>
              <p className="text-sm text-muted-foreground">確認待ち</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                発送待ち
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-500">8</p>
              <p className="text-sm text-muted-foreground">入金確認済み</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                アクティブ顧客
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">234</p>
              <p className="text-sm text-muted-foreground">契約中</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">最新の申込</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">APP-2024-0125-001</p>
                    <p className="text-sm text-muted-foreground">
                      山田太郎 - アダアフィプラン×3
                    </p>
                  </div>
                  <Badge>KYC待ち</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">APP-2024-0125-002</p>
                    <p className="text-sm text-muted-foreground">
                      鈴木花子 - ポケカプラン×1
                    </p>
                  </div>
                  <Badge variant="success">入金確認済</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">APP-2024-0124-015</p>
                    <p className="text-sm text-muted-foreground">
                      株式会社ABC - アダアフィプラン×10
                    </p>
                  </div>
                  <Badge variant="secondary">発送済み</Badge>
                </div>
              </div>
              <Link href="/admin/applications">
                <Button variant="link" className="mt-4 px-0">
                  すべて表示 →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">KYC確認待ち</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">山田太郎</p>
                    <p className="text-sm text-muted-foreground">
                      運転免許証 - 15分前
                    </p>
                  </div>
                  <Button size="sm">確認する</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">佐藤一郎</p>
                    <p className="text-sm text-muted-foreground">
                      マイナンバーカード - 1時間前
                    </p>
                  </div>
                  <Button size="sm">確認する</Button>
                </div>
              </div>
              <Link href="/admin/kyc">
                <Button variant="link" className="mt-4 px-0">
                  すべて表示 →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
