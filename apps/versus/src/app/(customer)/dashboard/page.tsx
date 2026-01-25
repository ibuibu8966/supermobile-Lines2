import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@repo/ui";
import { Plus, Smartphone, FileText, Settings, LogOut } from "lucide-react";

export default function CustomerDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">マイページ</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              山田 太郎 様
            </span>
            <Button variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-6">
            <Link
              href="/dashboard"
              className="py-3 border-b-2 border-primary text-sm font-medium"
            >
              ダッシュボード
            </Link>
            <Link
              href="/contracts"
              className="py-3 border-b-2 border-transparent text-sm text-muted-foreground hover:text-foreground"
            >
              契約一覧
            </Link>
            <Link
              href="/settings"
              className="py-3 border-b-2 border-transparent text-sm text-muted-foreground hover:text-foreground"
            >
              設定
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">ダッシュボード</h2>
          <Link href="/apply">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              追加申込み
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                ご利用中の回線
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">3</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                今月のご請求
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">¥11,940</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                次回請求日
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">2/1</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ご利用中の回線</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">090-1234-5678</p>
                    <p className="text-sm text-muted-foreground">
                      アダアフィプラン
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="success">利用中</Badge>
                  <Button variant="outline" size="sm">
                    詳細
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">090-2345-6789</p>
                    <p className="text-sm text-muted-foreground">
                      アダアフィプラン
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="success">利用中</Badge>
                  <Button variant="outline" size="sm">
                    詳細
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">090-3456-7890</p>
                    <p className="text-sm text-muted-foreground">
                      ポケカプラン
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="success">利用中</Badge>
                  <Button variant="outline" size="sm">
                    詳細
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
