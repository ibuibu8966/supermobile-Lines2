"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, Check, AlertCircle, CheckCircle2, AlertTriangle, RotateCw } from "lucide-react";
import type { SimIccidValidation } from "@/repositories/sim.repository";
import type { LineScanConflict } from "@/entities/line-scan.entity";

interface LineTag {
  id: number;
  code: string;
  name: string;
}

interface LineReserveTag {
  id: number;
  code: string;
  name: string;
}

type IccidItemStatus = "pending" | "saving" | "saved" | "failed" | "conflict";

interface IccidItem {
  iccid: string;
  stockStatus: "ok" | "warning";
  saveStatus: IccidItemStatus;
  error?: string;
  conflict?: LineScanConflict;
  retryCount: number;
}

interface IccidScanModalProps {
  applicationId: string;
  notActivatedCount: number;
  existingIccids: Set<string>;
  lineTags: LineTag[];
  lineReserveTags: LineReserveTag[];
  simValidationMap: Record<string, SimIccidValidation>;
  onClose: () => void;
  onComplete: () => void;
}

const MAX_RETRY = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // 指数バックオフ

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = MAX_RETRY
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      // サーバーエラー(5xx)のみリトライ、4xxはリトライしない
      if (res.ok || res.status < 500) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt] || 4000));
    }
  }
  throw lastError || new Error("リクエストに失敗しました");
}

export function IccidScanModal({
  applicationId,
  notActivatedCount,
  existingIccids,
  lineTags,
  lineReserveTags,
  simValidationMap,
  onClose,
  onComplete,
}: IccidScanModalProps) {
  const [iccids, setIccids] = useState<IccidItem[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [contractMonth, setContractMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [lineTagId, setLineTagId] = useState<string>("");
  const [lineReserveTagId, setLineReserveTagId] = useState<string>("");
  const [autoEnter, setAutoEnter] = useState(true);
  const [autoEnterLength, setAutoEnterLength] = useState(19);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false); // 「完了して保存」待機中
  const inputRef = useRef<HTMLInputElement>(null);

  // スキャン開始後は設定変更をロック
  const hasStartedScanning = iccids.length > 0;

  // バックグラウンドキュー
  const isProcessingRef = useRef(false);
  const queueRef = useRef<string[]>([]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 1件登録API呼び出し
  const saveSingleIccid = useCallback(async (iccid: string): Promise<{
    status: "ok" | "conflict" | "no_lines" | "error";
    conflict?: LineScanConflict;
    error?: string;
  }> => {
    try {
      const res = await fetchWithRetry(
        `/api/applications/${applicationId}/lines/scan-single`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            iccid,
            contractMonth: contractMonth + "-01",
            lineTagId: lineTagId ? parseInt(lineTagId) : null,
            lineReserveTagId: lineReserveTagId ? parseInt(lineReserveTagId) : null,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return { status: "error", error: data.error || "登録に失敗しました" };
      }

      return data;
    } catch {
      return { status: "error", error: "ネットワークエラー（リトライ上限）" };
    }
  }, [applicationId, contractMonth, lineTagId, lineReserveTagId]);

  // キュー処理
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;

    isProcessingRef.current = true;

    // ステータスを saving に更新
    setIccids((prev) =>
      prev.map((item) => item.iccid === next ? { ...item, saveStatus: "saving" } : item)
    );

    const result = await saveSingleIccid(next);

    setIccids((prev) =>
      prev.map((item) => {
        if (item.iccid !== next) return item;
        switch (result.status) {
          case "ok":
            return { ...item, saveStatus: "saved" };
          case "conflict":
            return { ...item, saveStatus: "conflict", conflict: result.conflict };
          case "no_lines":
            return { ...item, saveStatus: "failed", error: "未割当の回線がありません" };
          default:
            return { ...item, saveStatus: "failed", error: result.error || "登録に失敗しました" };
        }
      })
    );

    isProcessingRef.current = false;
    // 次のキューを処理
    processQueue();
  }, [saveSingleIccid]);

  // キューに追加してprocessQueue呼び出し
  const enqueue = useCallback((iccid: string) => {
    queueRef.current.push(iccid);
    processQueue();
  }, [processQueue]);

  const validateIccid = (iccid: string): boolean => {
    return /^[A-Z0-9]{15,20}$/.test(iccid);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    setCurrentInput(value);
    setError(null);

    if (autoEnter && value.length === autoEnterLength) {
      addIccid(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentInput) {
      e.preventDefault();
      addIccid(currentInput);
    }
  };

  const addIccid = (iccid: string) => {
    if (!validateIccid(iccid)) {
      setError("ICCIDは15〜20桁の英数字です");
      return;
    }

    if (iccids.some((item) => item.iccid === iccid)) {
      setError("このICCIDは既に入力されています");
      return;
    }

    if (existingIccids.has(iccid)) {
      setError("このICCIDは既にこの申し込みの回線に割り当て済みです");
      return;
    }

    if (!contractMonth) {
      setError("契約月を選択してください");
      return;
    }

    const savedCount = iccids.filter((i) => i.saveStatus === "saved").length;
    const pendingCount = iccids.filter((i) => i.saveStatus !== "failed" && i.saveStatus !== "conflict").length;
    const remaining = notActivatedCount - savedCount - (pendingCount - savedCount);
    if (remaining <= 0) {
      setError("未割当回線数の上限に達しました");
      return;
    }

    // SIM検証（警告のみ、ブロックしない）
    const isMapLoaded = Object.keys(simValidationMap).length > 0;
    const validation = isMapLoaded ? simValidationMap[iccid] : undefined;
    const isRegisteredAndValid =
      isMapLoaded &&
      validation?.isInStock &&
      validation?.hasEligibleTag &&
      !validation?.isConsumed;
    const stockStatus: "ok" | "warning" = isRegisteredAndValid ? "ok" : "warning";

    const newItem: IccidItem = {
      iccid,
      stockStatus,
      saveStatus: "pending",
      retryCount: 0,
    };

    setIccids((prev) => [newItem, ...prev]);
    setCurrentInput("");
    setError(null);

    // バックグラウンドキューに追加
    enqueue(iccid);

    inputRef.current?.focus();
  };

  const removeIccid = (index: number) => {
    const item = iccids[index];
    // 保存済みの場合は削除不可（DBに既に保存されている）
    if (item.saveStatus === "saved") return;
    // キューからも削除
    const queueIdx = queueRef.current.indexOf(item.iccid);
    if (queueIdx !== -1) queueRef.current.splice(queueIdx, 1);
    setIccids((prev) => prev.filter((_, i) => i !== index));
  };

  // 失敗したICCIDを再試行
  const retryFailed = useCallback((iccid: string) => {
    setIccids((prev) =>
      prev.map((item) =>
        item.iccid === iccid
          ? { ...item, saveStatus: "pending", error: undefined, retryCount: item.retryCount + 1 }
          : item
      )
    );
    enqueue(iccid);
  }, [enqueue]);

  // 競合解決: 解約して登録
  const handleForceReassign = useCallback(async (iccid: string, cancelLineId: string) => {
    setIccids((prev) =>
      prev.map((item) => item.iccid === iccid ? { ...item, saveStatus: "saving", conflict: undefined } : item)
    );

    try {
      const res = await fetchWithRetry(
        `/api/applications/${applicationId}/lines/force-reassign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            iccid,
            cancelLineId,
            contractMonth: contractMonth + "-01",
            lineTagId: lineTagId ? parseInt(lineTagId) : null,
            lineReserveTagId: lineReserveTagId ? parseInt(lineReserveTagId) : null,
          }),
        }
      );

      const data = await res.json();

      setIccids((prev) =>
        prev.map((item) => {
          if (item.iccid !== iccid) return item;
          if (res.ok && data.status === "ok") {
            return { ...item, saveStatus: "saved", conflict: undefined };
          }
          return { ...item, saveStatus: "failed", error: data.error || "競合解決に失敗しました" };
        })
      );
    } catch {
      setIccids((prev) =>
        prev.map((item) =>
          item.iccid === iccid
            ? { ...item, saveStatus: "failed", error: "ネットワークエラー" }
            : item
        )
      );
    }
  }, [applicationId, contractMonth, lineTagId, lineReserveTagId]);

  // 競合をスキップ（リストから削除）
  const skipConflict = useCallback((iccid: string) => {
    setIccids((prev) => prev.filter((item) => item.iccid !== iccid));
  }, []);

  // 「閉じる」
  const handleSubmit = async () => {
    if (iccids.length === 0) {
      setError("ICCIDを入力してください");
      return;
    }

    // キューに残っている場合は待機
    const hasPending = iccids.some((i) => i.saveStatus === "pending" || i.saveStatus === "saving");
    if (hasPending) {
      setIsClosing(true);
      return;
    }

    // 失敗/競合がある場合は表示
    const failedCount = iccids.filter((i) => i.saveStatus === "failed").length;
    const conflictCount = iccids.filter((i) => i.saveStatus === "conflict").length;
    if (failedCount > 0 || conflictCount > 0) {
      setError(`${failedCount + conflictCount}件の問題があります。解決してから閉じてください。`);
      return;
    }

    // 全件saved → 完了
    onComplete();
  };

  // isClosing中に全件完了したら自動で閉じる
  useEffect(() => {
    if (!isClosing) return;
    const hasPending = iccids.some((i) => i.saveStatus === "pending" || i.saveStatus === "saving");
    if (!hasPending) {
      const failedCount = iccids.filter((i) => i.saveStatus === "failed").length;
      const conflictCount = iccids.filter((i) => i.saveStatus === "conflict").length;
      if (failedCount === 0 && conflictCount === 0) {
        onComplete();
      } else {
        setIsClosing(false);
        setError(`${failedCount + conflictCount}件の問題があります。解決してから完了してください。`);
      }
    }
  }, [isClosing, iccids, onComplete]);

  // 統計
  const savedCount = iccids.filter((i) => i.saveStatus === "saved").length;
  const pendingCount = iccids.filter((i) => i.saveStatus === "pending" || i.saveStatus === "saving").length;
  const failedCount = iccids.filter((i) => i.saveStatus === "failed").length;
  const conflictCount = iccids.filter((i) => i.saveStatus === "conflict").length;
  const totalRemaining = notActivatedCount - savedCount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">ICCID連続入力</h2>
            <div className="flex items-center gap-4 text-sm mt-1">
              {savedCount > 0 && (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  登録済み: {savedCount}件
                </span>
              )}
              <span className="text-gray-500">
                残り回線: <span className="font-bold text-gray-700">{totalRemaining}</span>件
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 設定 */}
        <div className="px-6 py-4 border-b bg-gray-50 space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoEnter}
                onChange={(e) => setAutoEnter(e.target.checked)}
                className="rounded"
              />
              バーコードリーダー自動送信
            </label>
            <select
              className="px-2 py-1 border rounded text-sm"
              value={autoEnterLength}
              onChange={(e) => setAutoEnterLength(Number(e.target.value))}
              disabled={!autoEnter}
            >
              <option value={15}>15桁</option>
              <option value={19}>19桁</option>
            </select>
            <span className="text-xs text-gray-500">
              （{autoEnterLength}桁入力時に自動追加）
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                契約月 <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                className="w-full px-3 py-2 border rounded-md text-sm disabled:bg-gray-100 disabled:text-gray-500"
                value={contractMonth}
                onChange={(e) => setContractMonth(e.target.value)}
                disabled={hasStartedScanning}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">回線タグ</label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm disabled:bg-gray-100 disabled:text-gray-500"
                value={lineTagId}
                onChange={(e) => setLineTagId(e.target.value)}
                disabled={hasStartedScanning}
              >
                <option value="">未設定</option>
                {lineTags.map((tag) => (
                  <option key={tag.id} value={tag.id.toString()}>{tag.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">予備タグ</label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm disabled:bg-gray-100 disabled:text-gray-500"
                value={lineReserveTagId}
                onChange={(e) => setLineReserveTagId(e.target.value)}
                disabled={hasStartedScanning}
              >
                <option value="">未設定</option>
                {lineReserveTags.map((tag) => (
                  <option key={tag.id} value={tag.id.toString()}>{tag.name}</option>
                ))}
              </select>
            </div>
          </div>
          {hasStartedScanning && (
            <p className="text-xs text-amber-600">※ スキャン開始後は設定を変更できません。変更する場合はICCIDを全て削除してください。</p>
          )}
        </div>

        {/* 入力エリア */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                className="w-full px-4 py-3 border-2 rounded-lg text-lg font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="ICCIDを入力またはスキャン..."
                value={currentInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                maxLength={20}
                disabled={isClosing}
              />
            </div>
            <Button
              onClick={() => addIccid(currentInput)}
              disabled={!currentInput || !validateIccid(currentInput) || isClosing}
            >
              追加
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* 進捗 */}
          <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
            <span>
              入力: <span className="font-bold text-blue-600">{iccids.length}</span>件
              {pendingCount > 0 && (
                <span className="text-xs text-gray-400 ml-2">（{pendingCount}件処理中）</span>
              )}
              {failedCount > 0 && (
                <span className="text-xs text-red-500 ml-2">（{failedCount}件失敗）</span>
              )}
              {conflictCount > 0 && (
                <span className="text-xs text-amber-500 ml-2">（{conflictCount}件競合）</span>
              )}
            </span>
            <span>
              残り: <span className="font-bold">{totalRemaining}</span>件
            </span>
          </div>

          {/* プログレスバー */}
          <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${(savedCount / notActivatedCount) * 100}%` }}
            />
          </div>
          {savedCount > 0 && (
            <div className="text-xs text-gray-400 mt-1 text-right">
              {savedCount} / {notActivatedCount}件登録済み
            </div>
          )}
        </div>

        {/* 入力済みリスト */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            入力済みICCID ({iccids.length}件)
          </div>
          {iccids.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              ICCIDを入力してください
            </div>
          ) : (
            <div className="space-y-1">
              {iccids.map((item, index) => (
                <div key={item.iccid}>
                  <div
                    className={`flex items-center justify-between py-2 px-3 rounded ${
                      item.saveStatus === "failed"
                        ? "bg-red-50 border border-red-200"
                        : item.saveStatus === "conflict"
                        ? "bg-amber-50 border border-amber-200"
                        : item.stockStatus === "warning"
                        ? "bg-yellow-50 border border-yellow-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.saveStatus === "saving" && (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      )}
                      {item.saveStatus === "saved" && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      {item.saveStatus === "failed" && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {item.saveStatus === "conflict" && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      {item.saveStatus === "pending" && (
                        <Check className={`h-4 w-4 ${item.stockStatus === "warning" ? "text-yellow-500" : "text-green-500"}`} />
                      )}
                      <span className="font-mono text-sm">{item.iccid}</span>
                      {item.stockStatus === "warning" && item.saveStatus !== "failed" && item.saveStatus !== "conflict" && (
                        <span className="text-xs text-yellow-600">（SIMマスタ未確認）</span>
                      )}
                      {item.saveStatus === "failed" && (
                        <span className="text-xs text-red-600">{item.error}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {item.saveStatus === "failed" && (
                        <button
                          onClick={() => retryFailed(item.iccid)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="再試行"
                        >
                          <RotateCw className="h-4 w-4" />
                        </button>
                      )}
                      {item.saveStatus !== "saved" && (
                        <button
                          onClick={() => removeIccid(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* 競合: インライン解決UI */}
                  {item.saveStatus === "conflict" && item.conflict && (
                    <div className="ml-6 mt-1 mb-2 p-3 bg-amber-50 rounded border border-amber-200 text-sm">
                      <p className="text-amber-800">
                        申込 <span className="font-bold">{item.conflict.currentApplicationNumber}</span>
                        （{item.conflict.currentCustomerName}）で使用中
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleForceReassign(item.iccid, item.conflict!.currentLineId)}
                        >
                          解約して登録
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => skipConflict(item.iccid)}
                        >
                          スキップ
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" onClick={handleSubmit} disabled={isClosing}>
            {isClosing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                処理完了待ち...
              </>
            ) : (
              "閉じる"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
