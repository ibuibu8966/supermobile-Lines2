import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";

export default function SuppliersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">仕入れ先管理</h1>
              <p className="text-sm text-gray-500 mt-1">
                SIM仕入れ先の登録・編集
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-end mb-6">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規仕入れ先登録
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">仕入れ先一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">コード</th>
                  <th className="text-left py-3 px-4">仕入れ先名</th>
                  <th className="text-left py-3 px-4">SIM数</th>
                  <th className="text-left py-3 px-4">ステータス</th>
                  <th className="text-right py-3 px-4">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">1</td>
                  <td className="py-3 px-4 font-mono">arts</td>
                  <td className="py-3 px-4">アーツ</td>
                  <td className="py-3 px-4">1,234</td>
                  <td className="py-3 px-4">
                    <Badge variant="success">有効</Badge>
                  </td>
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
                  <td className="py-3 px-4 font-mono">bmobile</td>
                  <td className="py-3 px-4">Bモバイル</td>
                  <td className="py-3 px-4">567</td>
                  <td className="py-3 px-4">
                    <Badge variant="success">有効</Badge>
                  </td>
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
                  <td className="py-3 px-4 font-mono">iij</td>
                  <td className="py-3 px-4">IIJ</td>
                  <td className="py-3 px-4">890</td>
                  <td className="py-3 px-4">
                    <Badge variant="success">有効</Badge>
                  </td>
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
