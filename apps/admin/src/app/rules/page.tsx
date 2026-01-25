import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";

export default function RulesPage() {
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
        <div className="flex justify-end mb-6">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規ルール作成
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">販売ルール一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">優先度</th>
                  <th className="text-left py-3 px-4">用途タグ</th>
                  <th className="text-left py-3 px-4">仕入れ先条件</th>
                  <th className="text-left py-3 px-4">キャリア条件</th>
                  <th className="text-left py-3 px-4">排他タグ</th>
                  <th className="text-left py-3 px-4">MNP必須</th>
                  <th className="text-left py-3 px-4">最低契約日数</th>
                  <th className="text-right py-3 px-4">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">1</td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary">アダアフィ</Badge>
                  </td>
                  <td className="py-3 px-4">全て</td>
                  <td className="py-3 px-4">docomo, au</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <Badge variant="outline">MNP弾</Badge>
                    </div>
                  </td>
                  <td className="py-3 px-4">不要</td>
                  <td className="py-3 px-4">30日</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">2</td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary">ポケカ認証</Badge>
                  </td>
                  <td className="py-3 px-4">全て</td>
                  <td className="py-3 px-4">全て</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <Badge variant="outline">アダアフィ</Badge>
                      <Badge variant="outline">MNP弾</Badge>
                    </div>
                  </td>
                  <td className="py-3 px-4">不要</td>
                  <td className="py-3 px-4">14日</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">3</td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary">MNP弾</Badge>
                  </td>
                  <td className="py-3 px-4">アーツ</td>
                  <td className="py-3 px-4">docomo</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <Badge variant="outline">アダアフィ</Badge>
                      <Badge variant="outline">ポケカ認証</Badge>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="success">必須</Badge>
                  </td>
                  <td className="py-3 px-4">90日</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

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
    </div>
  );
}
