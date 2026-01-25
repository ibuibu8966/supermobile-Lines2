import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { Plus, Upload, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";

export default function SimsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SIM一覧</h1>
              <p className="text-sm text-gray-500 mt-1">
                SIMカードの管理・検索・詳細確認
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="ICCID / 電話番号で検索..."
              className="px-4 py-2 border rounded-md w-64"
            />
            <select className="px-4 py-2 border rounded-md">
              <option value="">キャリア</option>
              <option value="DOCOMO">docomo</option>
              <option value="AU">au</option>
              <option value="SOFTBANK">SoftBank</option>
              <option value="RAKUTEN">楽天</option>
            </select>
            <select className="px-4 py-2 border rounded-md">
              <option value="">ステータス</option>
              <option value="IN_STOCK">在庫</option>
              <option value="ACTIVE">利用中</option>
              <option value="RETURNING">返却中</option>
              <option value="RETIRED">廃止</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Link href="/sims/import">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                CSVインポート
              </Button>
            </Link>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新規登録
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">SIM一覧（親子表示）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 w-8"></th>
                    <th className="text-left py-3 px-4">ICCID</th>
                    <th className="text-left py-3 px-4">電話番号</th>
                    <th className="text-left py-3 px-4">キャリア</th>
                    <th className="text-left py-3 px-4">MNP</th>
                    <th className="text-left py-3 px-4">消費済みタグ</th>
                    <th className="text-left py-3 px-4">ステータス</th>
                    <th className="text-left py-3 px-4">仕入れ先</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <button className="text-gray-400 hover:text-gray-600">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono">8912340001234567890</td>
                    <td className="py-3 px-4">090-1234-5678</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">docomo</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="success">可</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Badge variant="secondary">アダアフィ</Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge>在庫</Badge>
                    </td>
                    <td className="py-3 px-4">アーツ</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <button className="text-gray-600">
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono">8912340001234567891</td>
                    <td className="py-3 px-4">090-2345-6789</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">au</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="destructive">不可</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        <Badge variant="secondary">アダアフィ</Badge>
                        <Badge variant="secondary">ポケカ</Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="success">利用中</Badge>
                    </td>
                    <td className="py-3 px-4">Bモバ</td>
                  </tr>
                  <tr className="bg-gray-50/50 border-b">
                    <td className="py-2 px-4"></td>
                    <td colSpan={7} className="py-2 px-4">
                      <div className="pl-4 border-l-2 border-gray-300 ml-2">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>2024/3/15〜4/20</span>
                          <span>顧客A</span>
                          <Badge variant="outline">物販</Badge>
                          <Badge variant="secondary">アダアフィ</Badge>
                          <Badge>返却済</Badge>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-gray-50/50 border-b">
                    <td className="py-2 px-4"></td>
                    <td colSpan={7} className="py-2 px-4">
                      <div className="pl-4 border-l-2 border-gray-300 ml-2">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>2024/5/10〜現在</span>
                          <span>顧客B</span>
                          <Badge variant="outline">バーサス</Badge>
                          <Badge variant="secondary">ポケカ</Badge>
                          <Badge variant="success">利用中</Badge>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
              <span>3件中 1-3件を表示</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  前へ
                </Button>
                <Button variant="outline" size="sm" disabled>
                  次へ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
