"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from "@repo/ui";
import { ArrowLeft, Upload, Download, FileText, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface ImportError {
  row: number;
  iccid: string;
  error: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: ImportError[];
}

interface ParsedRow {
  iccid: string;
  msisdn?: string;
  supplier: string;
  simType?: string;
  carrierType?: string;
  plan?: string;
  isMnpEligible?: string;
  isAutoCancel?: string;
  supplierContractStart?: string;
  supplierContractEnd?: string;
}

const CSV_TEMPLATE = `iccid,msisdn,supplier,simType,carrierType,plan,isMnpEligible,isAutoCancel
8912340001234567890,09012345678,アーツ,INDIVIDUAL,DOCOMO,基本プラン,true,false
8912340001234567891,09023456789,Bモバ,CORPORATE,AU,,false,true`;

export default function SimImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      if (row.iccid) {
        rows.push(row as unknown as ParsedRow);
      }
    }

    return rows;
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      alert("CSVファイルを選択してください");
      return;
    }

    setFile(selectedFile);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const data = parseCSV(text);
      setParsedData(data);
    };
    reader.readAsText(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    setResult(null);

    try {
      const res = await fetch("/api/sims/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: parsedData }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        alert(data.error || "インポートに失敗しました");
      }
    } catch (error) {
      console.error("インポートエラー:", error);
      alert("インポートに失敗しました");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sim-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFile = () => {
    setFile(null);
    setParsedData([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  CSVファイルをドラッグ＆ドロップ
                </p>
                <p className="text-xs text-gray-500">または</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) handleFileSelect(selectedFile);
                  }}
                />
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  ファイルを選択
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {parsedData.length}件のデータ
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFile}
                    disabled={importing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {parsedData.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">ICCID</th>
                          <th className="text-left py-2 px-2">電話番号</th>
                          <th className="text-left py-2 px-2">仕入れ先</th>
                          <th className="text-left py-2 px-2">キャリア</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-2 px-2 font-mono">{row.iccid}</td>
                            <td className="py-2 px-2">{row.msisdn || "—"}</td>
                            <td className="py-2 px-2">{row.supplier}</td>
                            <td className="py-2 px-2">{row.carrierType || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.length > 5 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        他 {parsedData.length - 5}件...
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {result && (
              <div className={`rounded-lg p-4 ${
                result.failed === 0 ? "bg-green-50" : "bg-yellow-50"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.failed === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="font-medium">
                    インポート完了
                  </span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-700">
                    成功: {result.success}件
                  </span>
                  {result.failed > 0 && (
                    <span className="text-red-700">
                      失敗: {result.failed}件
                    </span>
                  )}
                </div>
                {result.errors.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-medium text-gray-700">エラー詳細:</p>
                    {result.errors.slice(0, 5).map((err, i) => (
                      <p key={i} className="text-xs text-red-600">
                        行{err.row} ({err.iccid}): {err.error}
                      </p>
                    ))}
                    {result.errors.length > 5 && (
                      <p className="text-xs text-gray-500">
                        他 {result.errors.length - 5}件のエラー...
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">CSVフォーマット</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><Badge variant="destructive" className="text-xs">必須</Badge> iccid, supplier</p>
                <p><Badge variant="secondary" className="text-xs">任意</Badge> msisdn, simType, carrierType, plan, isMnpEligible, isAutoCancel</p>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <p>simType: INDIVIDUAL（個人）/ CORPORATE（法人）</p>
                <p>carrierType: DOCOMO / AU / SOFTBANK / RAKUTEN</p>
                <p>isMnpEligible, isAutoCancel: true / false</p>
              </div>
              <Button
                variant="link"
                className="px-0 mt-2"
                onClick={downloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                テンプレートをダウンロード
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/sims">
                <Button variant="outline" disabled={importing}>
                  {result ? "一覧に戻る" : "キャンセル"}
                </Button>
              </Link>
              {!result && (
                <Button
                  onClick={handleImport}
                  disabled={parsedData.length === 0 || importing}
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      インポート中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      インポート実行 ({parsedData.length}件)
                    </>
                  )}
                </Button>
              )}
              {result && result.success > 0 && (
                <Button onClick={() => router.push("/sims")}>
                  SIM一覧を確認
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
