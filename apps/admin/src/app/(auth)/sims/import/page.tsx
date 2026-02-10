"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Label,
  Input,
} from "@repo/ui";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  parseSupplierFile,
  SUPPLIER_CONFIGS,
  type ParsedSimRow,
  type ParseResult,
  type SimTypeOption,
} from "@/lib/supplier-parsers";

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

type Step = "select-supplier" | "upload" | "preview" | "result";

const SIM_TYPE_LABELS: Record<SimTypeOption, string> = {
  INDIVIDUAL: "個人",
  CORPORATE: "法人",
  BOTH: "両方（CSVから判定）",
};

export default function SimImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ステップ管理
  const [step, setStep] = useState<Step>("select-supplier");

  // 設定
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedSimType, setSelectedSimType] = useState<SimTypeOption | null>(null);
  const [contractEndDate, setContractEndDate] = useState<string>("");
  const [carrierType, setCarrierType] = useState<string>("");
  const [isMnpEligible, setIsMnpEligible] = useState(false);
  const [isAutoCancel, setIsAutoCancel] = useState(false);
  const [autoCancelDate, setAutoCancelDate] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  // 用途タグ一覧
  const [usageTags, setUsageTags] = useState<Array<{ id: number; name: string; code: string }>>([]);

  // ファイル・データ
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  // 処理状態
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const selectedConfig = selectedSupplier ? SUPPLIER_CONFIGS[selectedSupplier] : null;

  useEffect(() => {
    fetch("/api/usage-tags")
      .then((res) => res.json())
      .then((data) => setUsageTags(data))
      .catch(() => {});
  }, []);

  const handleSupplierSelect = (supplierCode: string) => {
    setSelectedSupplier(supplierCode);
    const config = SUPPLIER_CONFIGS[supplierCode];
    // デフォルトのsimTypeを設定
    if (config.simTypeOptions.includes("BOTH")) {
      setSelectedSimType("BOTH");
    } else {
      setSelectedSimType(config.simTypeOptions[0]);
    }
  };

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (!selectedSupplier || !selectedSimType) return;

      const config = SUPPLIER_CONFIGS[selectedSupplier];
      const validExtensions = config.accept.split(",");
      const fileExt = "." + selectedFile.name.split(".").pop()?.toLowerCase();

      if (!validExtensions.some((ext) => ext.trim() === fileExt)) {
        alert(`${config.name}のファイルは${config.accept}形式である必要があります`);
        return;
      }

      setFile(selectedFile);
      setParsing(true);

      try {
        const result = await parseSupplierFile(selectedFile, {
          supplier: selectedSupplier,
          simType: selectedSimType,
          supplierContractEnd: contractEndDate || undefined,
          carrierType: carrierType || undefined,
          isMnpEligible: isMnpEligible || undefined,
          isAutoCancel: isAutoCancel || undefined,
          autoCancelDate: autoCancelDate || undefined,
          eligibleTagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        });
        if (result.data.length === 0 && result.errors.length === 0) {
          result.errors.push({
            row: 0,
            message: "ファイルからデータを読み取れませんでした。ファイル形式やカラム名を確認してください。",
          });
        }
        setParseResult(result);
        if (result.data.length > 0) {
          setStep("preview");
        }
      } catch (error) {
        console.error("パースエラー:", error);
        alert("ファイルの解析に失敗しました");
      } finally {
        setParsing(false);
      }
    },
    [selectedSupplier, selectedSimType, contractEndDate, carrierType, isMnpEligible, isAutoCancel, autoCancelDate, selectedTagIds]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleImport = async () => {
    if (!parseResult || parseResult.data.length === 0) return;

    setImporting(true);
    setImportResult(null);

    try {
      const res = await fetch("/api/sims/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: parseResult.data }),
      });

      const data = await res.json();

      if (res.ok) {
        setImportResult(data);
        setStep("result");
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

  const resetAll = () => {
    setStep("select-supplier");
    setSelectedSupplier(null);
    setSelectedSimType(null);
    setContractEndDate("");
    setCarrierType("");
    setIsMnpEligible(false);
    setIsAutoCancel(false);
    setAutoCancelDate("");
    setSelectedTagIds([]);
    setFile(null);
    setParseResult(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const canProceedToUpload = selectedSupplier && selectedSimType;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">仕入れ先ファイルインポート</h1>
        <p className="text-sm text-gray-500 mt-1">
          仕入れ先から納品されたファイルをインポート
        </p>
      </div>

      {/* ステッププログレス */}
      <div className="max-w-3xl mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Badge variant={step === "select-supplier" ? "default" : "secondary"}>
            1. 仕入れ先選択
          </Badge>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <Badge variant={step === "upload" ? "default" : "secondary"}>
            2. ファイルアップロード
          </Badge>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <Badge variant={step === "preview" ? "default" : "secondary"}>
            3. プレビュー
          </Badge>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <Badge variant={step === "result" ? "default" : "secondary"}>
            4. 結果
          </Badge>
        </div>
      </div>

      <div className="max-w-3xl">
        {/* Step 1: 仕入れ先選択 */}
        {step === "select-supplier" && (
          <Card>
            <CardHeader>
              <CardTitle>仕入れ先を選択</CardTitle>
              <CardDescription>
                インポートするファイルの仕入れ先を選択してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 仕入れ先カード */}
              <div className="grid grid-cols-2 gap-4">
                {Object.values(SUPPLIER_CONFIGS).map((config) => (
                  <button
                    key={config.code}
                    type="button"
                    onClick={() => handleSupplierSelect(config.code)}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      selectedSupplier === config.code
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {config.fileType === "csv" ? (
                        <FileText className="h-8 w-8 text-green-600" />
                      ) : (
                        <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                      )}
                      <div>
                        <p className="font-medium">{config.name}</p>
                        <p className="text-sm text-gray-500">
                          {config.fileType === "csv" ? "CSV形式" : "Excel形式"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* simType選択 */}
              {selectedConfig && (
                <div className="space-y-3">
                  <Label>SIMタイプ</Label>
                  <div className="space-y-2">
                    {selectedConfig.simTypeOptions.map((option) => (
                      <label key={option} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="simType"
                          value={option}
                          checked={selectedSimType === option}
                          onChange={(e) => setSelectedSimType(e.target.value as SimTypeOption)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm">{SIM_TYPE_LABELS[option]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 解約日入力 */}
              {selectedConfig && (
                <div className="space-y-2">
                  <Label htmlFor="contractEndDate">解約日（任意）</Label>
                  <Input
                    id="contractEndDate"
                    type="date"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-gray-500">
                    入力した場合、全SIMにこの解約日が設定されます
                  </p>
                </div>
              )}

              {/* キャリア種別 */}
              {selectedConfig && (
                <div className="space-y-2">
                  <Label htmlFor="carrierType">キャリア種別（任意）</Label>
                  <select
                    id="carrierType"
                    value={carrierType}
                    onChange={(e) => setCarrierType(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm max-w-xs w-full"
                  >
                    <option value="">未設定</option>
                    <option value="DOCOMO">DOCOMO</option>
                    <option value="AU">AU</option>
                    <option value="SOFTBANK">SOFTBANK</option>
                    <option value="RAKUTEN">RAKUTEN</option>
                  </select>
                </div>
              )}

              {/* MNP転出可否 */}
              {selectedConfig && (
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMnpEligible}
                      onChange={(e) => setIsMnpEligible(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">MNP転出可</span>
                  </label>
                </div>
              )}

              {/* 自動解約 */}
              {selectedConfig && (
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAutoCancel}
                      onChange={(e) => {
                        setIsAutoCancel(e.target.checked);
                        if (!e.target.checked) setAutoCancelDate("");
                      }}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">自動解約</span>
                  </label>
                  {isAutoCancel && (
                    <div className="ml-6">
                      <Label htmlFor="autoCancelDate">自動解約日</Label>
                      <Input
                        id="autoCancelDate"
                        type="date"
                        value={autoCancelDate}
                        onChange={(e) => setAutoCancelDate(e.target.value)}
                        className="max-w-xs mt-1"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 利用可能用途タグ */}
              {selectedConfig && usageTags.length > 0 && (
                <div className="space-y-2">
                  <Label>利用可能な用途タグ（任意）</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {usageTags.map((tag) => (
                      <label key={tag.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTagIds.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTagIds((prev) => [...prev, tag.id]);
                            } else {
                              setSelectedTagIds((prev) => prev.filter((id) => id !== tag.id));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    選択した用途タグが全SIMに設定されます
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Link href="/sims">
                  <Button variant="outline">キャンセル</Button>
                </Link>
                <Button
                  onClick={() => setStep("upload")}
                  disabled={!canProceedToUpload}
                >
                  次へ
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: ファイルアップロード */}
        {step === "upload" && selectedConfig && (
          <Card>
            <CardHeader>
              <CardTitle>ファイルをアップロード</CardTitle>
              <CardDescription>
                {selectedConfig.name}の{selectedConfig.fileType === "csv" ? "CSV" : "Excel"}
                ファイルをアップロードしてください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 選択内容の確認 */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">仕入れ先:</span>{" "}
                    <span className="font-medium">{selectedConfig.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">SIMタイプ:</span>{" "}
                    <span className="font-medium">
                      {selectedSimType && SIM_TYPE_LABELS[selectedSimType]}
                    </span>
                  </div>
                  {contractEndDate && (
                    <div>
                      <span className="text-gray-500">解約日:</span>{" "}
                      <span className="font-medium">{contractEndDate}</span>
                    </div>
                  )}
                  {carrierType && (
                    <div>
                      <span className="text-gray-500">キャリア:</span>{" "}
                      <span className="font-medium">{carrierType}</span>
                    </div>
                  )}
                  {isMnpEligible && (
                    <div>
                      <span className="text-gray-500">MNP転出:</span>{" "}
                      <span className="font-medium">可</span>
                    </div>
                  )}
                  {isAutoCancel && (
                    <div>
                      <span className="text-gray-500">自動解約:</span>{" "}
                      <span className="font-medium">
                        ON{autoCancelDate ? ` (${autoCancelDate})` : ""}
                      </span>
                    </div>
                  )}
                  {selectedTagIds.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-500">用途タグ:</span>{" "}
                      <span className="font-medium">
                        {selectedTagIds
                          .map((id) => usageTags.find((t) => t.id === id)?.name)
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ドロップゾーン */}
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
                {parsing ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                    <p className="mt-2 text-sm text-gray-600">ファイルを解析中...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      {selectedConfig.fileType === "csv" ? "CSV" : "Excel"}
                      ファイルをドラッグ＆ドロップ
                    </p>
                    <p className="text-xs text-gray-500">または</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={selectedConfig.accept}
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
                  </>
                )}
              </div>

              {parseResult && parseResult.errors.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-700 mb-2">
                    パースエラー
                  </p>
                  {parseResult.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-xs text-red-600">
                      行{err.row}: {err.message}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("select-supplier")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: プレビュー */}
        {step === "preview" && parseResult && file && (
          <Card>
            <CardHeader>
              <CardTitle>プレビュー</CardTitle>
              <CardDescription>
                インポート内容を確認してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {selectedConfig?.fileType === "csv" ? (
                      <FileText className="h-8 w-8 text-green-600" />
                    ) : (
                      <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                    )}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {parseResult.data.length}件のデータ
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setParseResult(null);
                      setStep("upload");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">ICCID</th>
                        <th className="text-left py-2 px-2">電話番号</th>
                        <th className="text-left py-2 px-2">タイプ</th>
                        <th className="text-left py-2 px-2">プラン</th>
                        <th className="text-left py-2 px-2">契約開始日</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.data.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-2 px-2 font-mono">{row.iccid}</td>
                          <td className="py-2 px-2">{row.msisdn || "—"}</td>
                          <td className="py-2 px-2">
                            {row.simType === "CORPORATE" ? "法人" : "個人"}
                          </td>
                          <td className="py-2 px-2 max-w-[200px] truncate">
                            {row.plan || "—"}
                          </td>
                          <td className="py-2 px-2">
                            {row.supplierContractStart
                              ? new Date(row.supplierContractStart).toLocaleDateString(
                                  "ja-JP"
                                )
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parseResult.data.length > 10 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      他 {parseResult.data.length - 10}件...
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setParseResult(null);
                    setStep("upload");
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      インポート中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      インポート実行 ({parseResult.data.length}件)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: 結果 */}
        {step === "result" && importResult && (
          <Card>
            <CardHeader>
              <CardTitle>インポート完了</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={`rounded-lg p-4 ${
                  importResult.failed === 0 ? "bg-green-50" : "bg-yellow-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {importResult.failed === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="font-medium">
                    {importResult.failed === 0
                      ? "すべて正常にインポートされました"
                      : "一部エラーがあります"}
                  </span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-700">
                    成功: {importResult.success}件
                  </span>
                  {importResult.failed > 0 && (
                    <span className="text-red-700">
                      失敗: {importResult.failed}件
                    </span>
                  )}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-medium text-gray-700">エラー詳細:</p>
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <p key={i} className="text-xs text-red-600">
                        行{err.row} ({err.iccid}): {err.error}
                      </p>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p className="text-xs text-gray-500">
                        他 {importResult.errors.length - 5}件のエラー...
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={resetAll}>
                  別のファイルをインポート
                </Button>
                <Button onClick={() => router.push("/sims")}>
                  SIM一覧を確認
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
