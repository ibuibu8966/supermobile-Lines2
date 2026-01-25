import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@repo/ui";
import { ArrowLeft, Plus, Pencil, Settings } from "lucide-react";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">サービス・プラン管理</h1>
              <p className="text-sm text-gray-500 mt-1">
                サービスとプランの登録・編集
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-end mb-6">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規サービス登録
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>物販サービス</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">コード: buppan</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="success">有効</Badge>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    編集
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">プラン一覧</h4>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  プラン追加
                </Button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">プラン名</th>
                    <th className="text-left py-2 px-4">用途タグ</th>
                    <th className="text-left py-2 px-4">個人料金</th>
                    <th className="text-left py-2 px-4">法人料金</th>
                    <th className="text-left py-2 px-4">ステータス</th>
                    <th className="text-right py-2 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">アダアフィプラン</td>
                    <td className="py-2 px-4">
                      <Badge variant="secondary">アダアフィ</Badge>
                    </td>
                    <td className="py-2 px-4">¥3,980/月</td>
                    <td className="py-2 px-4">¥3,500/月〜</td>
                    <td className="py-2 px-4">
                      <Badge variant="success">有効</Badge>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">ポケカプラン</td>
                    <td className="py-2 px-4">
                      <Badge variant="secondary">ポケカ認証</Badge>
                    </td>
                    <td className="py-2 px-4">¥2,980/月</td>
                    <td className="py-2 px-4">¥2,500/月〜</td>
                    <td className="py-2 px-4">
                      <Badge variant="success">有効</Badge>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>バーサスサービス</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">コード: versus</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="success">有効</Badge>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    編集
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">プラン一覧</h4>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  プラン追加
                </Button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">プラン名</th>
                    <th className="text-left py-2 px-4">用途タグ</th>
                    <th className="text-left py-2 px-4">個人料金</th>
                    <th className="text-left py-2 px-4">法人料金</th>
                    <th className="text-left py-2 px-4">ステータス</th>
                    <th className="text-right py-2 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">バーサス標準プラン</td>
                    <td className="py-2 px-4">
                      <Badge variant="secondary">ポケカ認証</Badge>
                    </td>
                    <td className="py-2 px-4">¥4,980/月</td>
                    <td className="py-2 px-4">¥4,500/月〜</td>
                    <td className="py-2 px-4">
                      <Badge variant="success">有効</Badge>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Avarisサービス</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">コード: avaris</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="success">有効</Badge>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    編集
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">プラン一覧</h4>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  プラン追加
                </Button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">プラン名</th>
                    <th className="text-left py-2 px-4">用途タグ</th>
                    <th className="text-left py-2 px-4">個人料金</th>
                    <th className="text-left py-2 px-4">法人料金</th>
                    <th className="text-left py-2 px-4">ステータス</th>
                    <th className="text-right py-2 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">MNPプラン</td>
                    <td className="py-2 px-4">
                      <Badge variant="secondary">MNP弾</Badge>
                    </td>
                    <td className="py-2 px-4">¥5,980/月</td>
                    <td className="py-2 px-4">¥5,500/月〜</td>
                    <td className="py-2 px-4">
                      <Badge variant="success">有効</Badge>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
