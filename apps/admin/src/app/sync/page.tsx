import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { ArrowLeft, Plus, RefreshCw, Settings } from "lucide-react";

export default function SyncPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">外部連携・同期</h1>
              <p className="text-sm text-gray-500 mt-1">
                外部サービスとのデータ同期設定
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-end mb-6">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規連携先追加
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>物販Supabase</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    物販サービスの契約データを同期
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="success">接続済み</Badge>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">最終同期</p>
                  <p className="font-medium">2024/01/25 10:30</p>
                </div>
                <div>
                  <p className="text-muted-foreground">同期件数</p>
                  <p className="font-medium">1,234件</p>
                </div>
                <div>
                  <p className="text-muted-foreground">同期間隔</p>
                  <p className="font-medium">手動</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  今すぐ同期
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>バーサスSupabase</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    バーサスサービスの契約データを同期
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="success">接続済み</Badge>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">最終同期</p>
                  <p className="font-medium">2024/01/25 10:25</p>
                </div>
                <div>
                  <p className="text-muted-foreground">同期件数</p>
                  <p className="font-medium">567件</p>
                </div>
                <div>
                  <p className="text-muted-foreground">同期間隔</p>
                  <p className="font-medium">手動</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  今すぐ同期
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">同期ログ</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">日時</th>
                  <th className="text-left py-2 px-4">連携先</th>
                  <th className="text-left py-2 px-4">結果</th>
                  <th className="text-left py-2 px-4">処理件数</th>
                  <th className="text-left py-2 px-4">所要時間</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">2024/01/25 10:30:15</td>
                  <td className="py-2 px-4">物販Supabase</td>
                  <td className="py-2 px-4">
                    <Badge variant="success">成功</Badge>
                  </td>
                  <td className="py-2 px-4">50件</td>
                  <td className="py-2 px-4">2.3秒</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">2024/01/25 10:25:10</td>
                  <td className="py-2 px-4">バーサスSupabase</td>
                  <td className="py-2 px-4">
                    <Badge variant="success">成功</Badge>
                  </td>
                  <td className="py-2 px-4">23件</td>
                  <td className="py-2 px-4">1.1秒</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">2024/01/24 18:00:00</td>
                  <td className="py-2 px-4">物販Supabase</td>
                  <td className="py-2 px-4">
                    <Badge variant="destructive">失敗</Badge>
                  </td>
                  <td className="py-2 px-4">0件</td>
                  <td className="py-2 px-4">-</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
