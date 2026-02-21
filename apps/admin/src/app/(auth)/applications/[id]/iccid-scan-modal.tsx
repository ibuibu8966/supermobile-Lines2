"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, Check, AlertCircle, CheckCircle2 } from "lucide-react";
import type { SimIccidValidation } from "@/repositories/sim.repository";

const BATCH_PROMPT_SIZE = 50; // この件数に達したら中間登録を促す

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

interface IccidScanModalProps {
  applicationId: string;
  notActivatedCount: number;
  lineTags: LineTag[];
  lineReserveTags: LineReserveTag[];
  /** ページ読み込み時にプリフェッチ済みのSIM検証マップ（空オブジェクトの場合はプリフェッチ未完了） */
  simValidationMap: Record<string, SimIccidValidation>;
  onClose: () => void;
  onComplete: () => void;
}

export function IccidScanModal({
  applicationId,
  notActivatedCount,
  lineTags,
  lineReserveTags,
  simValidationMap,
  onClose,
  onComplete,
}: IccidScanModalProps) {
  const [iccids, setIccids] = useState<{ iccid: string; stockStatus: "ok" | "warning" }[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [contractMonth, setContractMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [lineTagId, setLineTagId] = useState<string>("");
  const [lineReserveTagId, setLineReserveTagId] = useState<string>("");
  const [autoEnter, setAutoEnter] = useState(true);
  const [autoEnterLength, setAutoEnterLength] = useState(19);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRegistered, setTotalRegistered] = useState(0); // 累積登録件数
  const [showBatchPrompt, setShowBatchPrompt] = useState(false); // 中間登録確認ポップアップ
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 中間登録確認ポップアップが閉じたらinputにフォーカスを戻す
  useEffect(() => {
    if (!showBatchPrompt) {
      inputRef.current?.focus();
    }
  }, [showBatchPrompt]);

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

    const remaining = notActivatedCount - totalRegistered - iccids.length;
    if (remaining <= 0) {
      setError("未割当回線数の上限に達しました");
      return;
    }

    // SIM検証マップが取得済みの場合のみ検証
    const isMapLoaded = Object.keys(simValidationMap).length > 0;
    if (isMapLoaded) {
      const validation = simValidationMap[iccid];

      if (!validation) {
        setError(`ICCID ${iccid} はシステムに登録されていないか、在庫状態ではありません`);
        return;
      }
      if (!validation.isInStock) {
        setError(`ICCID ${iccid} は現在在庫状態ではありません（既に使用中の可能性があります）`);
        return;
      }
      if (!validation.hasEligibleTag) {
        const tagNames = validation.planTagNames.join("、");
        setError(`ICCID ${iccid} はこのプランで必要な用途タグ（${tagNames}）に対応していません`);
        return;
      }
      if (validation.isConsumed) {
        const tagNames = validation.planTagNames.join("、");
        setError(`ICCID ${iccid} は用途タグ（${tagNames}）が既に他の契約で消費されています`);
        return;
      }
    }

    const isRegisteredAndValid =
      isMapLoaded &&
      simValidationMap[iccid]?.isInStock &&
      simValidationMap[iccid]?.hasEligibleTag &&
      !simValidationMap[iccid]?.isConsumed;
    const stockStatus: "ok" | "warning" = isRegisteredAndValid ? "ok" : "warning";

    const newIccids = [...iccids, { iccid, stockStatus }];
    setIccids(newIccids);
    setCurrentInput("");
    setError(null);

    // 50件刻みで中間登録ポップアップを表示
    if (newIccids.length > 0 && newIccids.length % BATCH_PROMPT_SIZE === 0) {
      setShowBatchPrompt(true);
    } else {
      inputRef.current?.focus();
    }
  };

  const removeIccid = (index: number) => {
    setIccids(iccids.filter((_, i) => i !== index));
  };

  // 中間登録・最終登録の共通処理
  const doSave = async (iccidsToSave: { iccid: string; stockStatus: "ok" | "warning" }[]) => {
    if (iccidsToSave.length === 0) return { ok: false, failedIccids: [] as string[] };
    if (!contractMonth) {
      setError("契約月を選択してください");
      return { ok: false, failedIccids: [] as string[] };
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/applications/${applicationId}/lines/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iccids: iccidsToSave.map((item) => item.iccid),
          contractMonth: contractMonth + "-01", // 文字列で送信（タイムゾーン問題を避けるためサーバー側でUTC変換）
          lineTagId: lineTagId ? parseInt(lineTagId) : null,
          lineReserveTagId: lineReserveTagId ? parseInt(lineReserveTagId) : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const failedIccids: string[] = data.failedIccids ?? [];
        return { ok: true, failedIccids, assignedCount: data.assignedCount as number };
      } else {
        setError(data.error || "割り当てに失敗しました");
        return { ok: false, failedIccids: [] as string[] };
      }
    } catch {
      setError("割り当てに失敗しました");
      return { ok: false, failedIccids: [] as string[] };
    } finally {
      setSaving(false);
    }
  };

  // 中間登録（ポップアップから「今すぐ登録」押下）
  const handleBatchSave = async () => {
    setShowBatchPrompt(false);
    const result = await doSave(iccids);
    if (result.ok) {
      const successCount = (result.assignedCount ?? iccids.length) - result.failedIccids.length;
      setTotalRegistered((prev) => prev + successCount);
      // 失敗分はリストに残す、成功分はクリア
      if (result.failedIccids.length > 0) {
        setIccids(iccids.filter((item) => result.failedIccids.includes(item.iccid)));
        setError(`${result.failedIccids.length}件の登録に失敗しました。リストに残っています。`);
      } else {
        setIccids([]);
      }
    }
  };

  // 最終登録（「完了して保存」押下）
  const handleSubmit = async () => {
    if (iccids.length === 0) {
      setError("ICCIDを入力してください");
      return;
    }
    const result = await doSave(iccids);
    if (result.ok) {
      if (result.failedIccids.length > 0) {
        const successCount = (result.assignedCount ?? iccids.length) - result.failedIccids.length;
        setTotalRegistered((prev) => prev + successCount);
        setIccids(iccids.filter((item) => result.failedIccids.includes(item.iccid)));
        setError(`${result.failedIccids.length}件の登録に失敗しました。リストに残っています。再度「完了して保存」を押してください。`);
      } else {
        onComplete();
      }
    }
  };

  const totalRemaining = notActivatedCount - totalRegistered - iccids.length;
  const currentBatchSize = iccids.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">ICCID連続入力</h2>
            <div className="flex items-center gap-4 text-sm mt-1">
              {totalRegistered > 0 && (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  累積登録済み: {totalRegistered}件
                </span>
              )}
              <span className="text-gray-500">
                残り回線: <span className="font-bold text-gray-700">{notActivatedCount - totalRegistered}</span>件
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
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={contractMonth}
                onChange={(e) => setContractMonth(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">回線タグ</label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={lineTagId}
                onChange={(e) => setLineTagId(e.target.value)}
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
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={lineReserveTagId}
                onChange={(e) => setLineReserveTagId(e.target.value)}
              >
                <option value="">未設定</option>
                {lineReserveTags.map((tag) => (
                  <option key={tag.id} value={tag.id.toString()}>{tag.name}</option>
                ))}
              </select>
            </div>
          </div>
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
                disabled={saving}
              />
            </div>
            <Button
              onClick={() => addIccid(currentInput)}
              disabled={!currentInput || !validateIccid(currentInput) || saving}
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
              現在入力中: <span className="font-bold text-blue-600">{currentBatchSize}</span>件
              {currentBatchSize > 0 && (
                <span className="text-xs text-gray-400 ml-2">
                  （次の登録まで {BATCH_PROMPT_SIZE - (currentBatchSize % BATCH_PROMPT_SIZE)}件）
                </span>
              )}
            </span>
            <span>
              残り: <span className="font-bold">{totalRemaining}</span>件
            </span>
          </div>

          {/* プログレスバー（累積ベース） */}
          <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${(totalRegistered / notActivatedCount) * 100}%` }}
            />
          </div>
          {totalRegistered > 0 && (
            <div className="text-xs text-gray-400 mt-1 text-right">
              累積: {totalRegistered} / {notActivatedCount}件登録済み
            </div>
          )}
        </div>

        {/* 入力済みリスト */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            入力済みICCID ({currentBatchSize}件)
          </div>
          {currentBatchSize === 0 ? (
            <div className="text-center py-8 text-gray-400">
              ICCIDを入力してください
            </div>
          ) : (
            <div className="space-y-1">
              {iccids.map((item, index) => (
                <div
                  key={item.iccid}
                  className={`flex items-center justify-between py-2 px-3 rounded ${
                    item.stockStatus === "warning"
                      ? "bg-yellow-50 border border-yellow-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Check className={`h-4 w-4 ${item.stockStatus === "warning" ? "text-yellow-500" : "text-green-500"}`} />
                    <span className="font-mono text-sm">{item.iccid}</span>
                    {item.stockStatus === "warning" && (
                      <span className="text-xs text-yellow-600">（SIMマスタ未登録）</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeIccid(index)}
                    className="text-gray-400 hover:text-red-500"
                    disabled={saving}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={saving || iccids.length === 0}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              `完了して保存 (${currentBatchSize}件)`
            )}
          </Button>
        </div>
      </div>

      {/* 50件刻み中間登録確認ポップアップ */}
      {showBatchPrompt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{iccids.length}件入力されました</h3>
                <p className="text-sm text-gray-500 mt-0.5">一旦登録しますか？</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              登録後はリストがクリアされ、続けて入力できます。
              累積登録数: <span className="font-bold">{totalRegistered}</span>件
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowBatchPrompt(false)}
                disabled={saving}
              >
                続けて入力
              </Button>
              <Button
                className="flex-1"
                onClick={handleBatchSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    登録中...
                  </>
                ) : (
                  "今すぐ登録"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
