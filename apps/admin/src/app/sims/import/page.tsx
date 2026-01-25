import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui";
import { ArrowLeft, Upload, Download } from "lucide-react";

export default function SimImportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/sims" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CSVインポート</h1>
              <p className="text-sm text-gray-500 mt-1">
                SIMデータを一括インポート
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>CSVファイルをアップロード</CardTitle>
            <CardDescription>
              指定のフォーマットに従ってCSVファイルを作成し、アップロードしてください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                CSVファイルをドラッグ＆ドロップ
              </p>
              <p className="text-xs text-gray-500">または</p>
              <Button variant="outline" className="mt-2">
                ファイルを選択
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">CSVフォーマット</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>必須列: iccid, supplier</p>
                <p>任意列: msisdn, carrierType, plan, isMnpEligible, isAutoCancel</p>
              </div>
              <Button variant="link" className="px-0 mt-2">
                <Download className="h-4 w-4 mr-2" />
                テンプレートをダウンロード
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/sims">
                <Button variant="outline">キャンセル</Button>
              </Link>
              <Button disabled>インポート実行</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
