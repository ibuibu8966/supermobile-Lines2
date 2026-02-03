"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@repo/ui";
import { X, Loader2, Check, AlertCircle } from "lucide-react";

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
  onClose: () => void;
  onComplete: () => void;
}

export function IccidScanModal({
  applicationId,
  notActivatedCount,
  lineTags,
  lineReserveTags,
  onClose,
  onComplete,
}: IccidScanModalProps) {
  const [iccids, setIccids] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [contractMonth, setContractMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [lineTagId, setLineTagId] = useState<string>("");
  const [lineReserveTagId, setLineReserveTagId] = useState<string>("");
  const [autoEnter, setAutoEnter] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const validateIccid = (iccid: string): boolean => {
    return /^[A-Z0-9]{15}$/.test(iccid);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    setCurrentInput(value);
    setError(null);

    // 自動送信モードの場合、15桁になったら自動追加
    if (autoEnter && value.length === 15) {
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
      setError("ICCIDは15桁の英数字です");
      return;
    }

    if (iccids.includes(iccid)) {
      setError("このICCIDは既に入力されています");
      return;
    }

    if (iccids.length >= notActivatedCount) {
      setError("未割当回線数の上限に達しました");
      return;
    }

    setIccids([...iccids, iccid]);
    setCurrentInput("");
    setError(null);
    inputRef.current?.focus();
  };

  const removeIccid = (index: number) => {
    setIccids(iccids.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (iccids.length === 0) {
      setError("ICCIDを入力してください");
      return;
    }

    if (!contractMonth) {
      setError("契約月を選択してください");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/applications/${applicationId}/lines/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iccids,
          contractMonth: new Date(contractMonth + "-01"),
          lineTagId: lineTagId ? parseInt(lineTagId) : null,
          lineReserveTagId: lineReserveTagId ? parseInt(lineReserveTagId) : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onComplete();
      } else {
        setError(data.error || "割り当てに失敗しました");
      }
    } catch (err) {
      console.error("ICCID割当エラー:", err);
      setError("割り当てに失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const remaining = notActivatedCount - iccids.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">ICCID連続入力</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
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
            <span className="text-xs text-gray-500">
              （15桁入力時に自動追加）
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                回線タグ
              </label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={lineTagId}
                onChange={(e) => setLineTagId(e.target.value)}
              >
                <option value="">未設定</option>
                {lineTags.map((tag) => (
                  <option key={tag.id} value={tag.id.toString()}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                予備タグ
              </label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={lineReserveTagId}
                onChange={(e) => setLineReserveTagId(e.target.value)}
              >
                <option value="">未設定</option>
                {lineReserveTags.map((tag) => (
                  <option key={tag.id} value={tag.id.toString()}>
                    {tag.name}
                  </option>
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
                maxLength={15}
              />
            </div>
            <Button
              onClick={() => addIccid(currentInput)}
              disabled={!currentInput || !validateIccid(currentInput)}
            >
              追加
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* 進捗 */}
          <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
            <span>
              進捗: <span className="font-bold text-blue-600">{iccids.length}</span> / {notActivatedCount} 回線
            </span>
            <span>
              残り: <span className="font-bold">{remaining}</span> 回線
            </span>
          </div>

          {/* プログレスバー */}
          <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(iccids.length / notActivatedCount) * 100}%` }}
            />
          </div>
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
              {iccids.map((iccid, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="font-mono text-sm">{iccid}</span>
                  </div>
                  <button
                    onClick={() => removeIccid(index)}
                    className="text-gray-400 hover:text-red-500"
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
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={saving || iccids.length === 0}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              `完了して保存 (${iccids.length}件)`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
