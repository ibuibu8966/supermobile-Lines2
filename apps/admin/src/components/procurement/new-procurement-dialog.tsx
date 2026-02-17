"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@repo/ui";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, parseCurrency } from "@repo/utils";

interface Supplier {
  id: number;
  name: string;
  code: string;
}

interface ProcurementLine {
  id: string;
  carrierType: string;
  quantity: string;
  unitPrice: string;
}

const CARRIER_OPTIONS = [
  { value: "DOCOMO", label: "ドコモ" },
  { value: "AU", label: "au" },
  { value: "SOFTBANK", label: "ソフトバンク" },
  { value: "RAKUTEN", label: "楽天モバイル" },
];

const DEFAULT_UNIT_PRICE = "1000";

export function NewProcurementDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [supplierId, setSupplierId] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [lines, setLines] = useState<ProcurementLine[]>([
    {
      id: crypto.randomUUID(),
      carrierType: "DOCOMO",
      quantity: "",
      unitPrice: DEFAULT_UNIT_PRICE,
    },
  ]);

  const { data: suppliers, isLoading: loadingSuppliers } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: () => fetch("/api/suppliers").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "発注の作成に失敗しました");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
      toast.success("発注を作成しました");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setSupplierId("");
    setTotalAmount("");
    setNote("");
    setLines([
      {
        id: crypto.randomUUID(),
        carrierType: "DOCOMO",
        quantity: "",
        unitPrice: DEFAULT_UNIT_PRICE,
      },
    ]);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: crypto.randomUUID(),
        carrierType: "DOCOMO",
        quantity: "",
        unitPrice: DEFAULT_UNIT_PRICE,
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter((line) => line.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof ProcurementLine, value: string) => {
    setLines(
      lines.map((line) =>
        line.id === id ? { ...line, [field]: value } : line
      )
    );
  };

  const calculateSubtotal = (line: ProcurementLine) => {
    const quantity = parseInt(line.quantity) || 0;
    const unitPrice = parseInt(line.unitPrice) || 0;
    return quantity * unitPrice;
  };

  const calculateSubtotalSum = () => {
    return lines.reduce((sum, line) => sum + calculateSubtotal(line), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!supplierId) {
      toast.error("仕入れ先を選択してください");
      return;
    }

    const validLines = lines.filter(
      (line) => line.carrierType && parseInt(line.quantity) > 0 && parseInt(line.unitPrice) > 0
    );

    if (validLines.length === 0) {
      toast.error("少なくとも1つの有効な明細を入力してください");
      return;
    }

    // totalAmountからカンマを削除して数値に変換
    const totalAmountValue = parseCurrency(totalAmount);
    if (!totalAmount || totalAmountValue <= 0) {
      toast.error("請求金額を入力してください");
      return;
    }

    const requestData = {
      supplierId: parseInt(supplierId),
      totalAmount: totalAmountValue,
      lines: validLines.map((line) => ({
        carrierType: line.carrierType,
        quantity: parseInt(line.quantity),
        unitPrice: parseInt(line.unitPrice),
      })),
      note: note || null,
    };

    createMutation.mutate(requestData);
  };

  const isValid = supplierId && lines.some((line) => parseInt(line.quantity) > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新規発注</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 仕入れ先 */}
          <div className="space-y-2">
            <Label htmlFor="supplier">
              仕入れ先 <span className="text-red-500">*</span>
            </Label>
            {loadingSuppliers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                読み込み中...
              </div>
            ) : (
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="仕入れ先を選択" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 発注明細 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                発注明細 <span className="text-red-500">*</span>
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-2" />
                明細を追加
              </Button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              {/* テーブルヘッダー */}
              <div className="grid grid-cols-12 gap-3 p-4 bg-gray-100 border-b border-gray-200">
                <div className="col-span-3 text-xs font-medium text-gray-600">回線種別</div>
                <div className="col-span-3 text-xs font-medium text-gray-600 text-right">回線数</div>
                <div className="col-span-3 text-xs font-medium text-gray-600 text-right">回線単価</div>
                <div className="col-span-2 text-xs font-medium text-gray-600 text-right">小計</div>
                <div className="col-span-1"></div>
              </div>

              {/* データ行 */}
              <div className="divide-y divide-gray-200">
                {lines.map((line, index) => (
                  <div
                    key={line.id}
                    className="grid grid-cols-12 gap-3 items-center p-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* 回線種別 */}
                    <div className="col-span-3">
                      <Select
                        value={line.carrierType}
                        onValueChange={(value) =>
                          updateLine(line.id, "carrierType", value)
                        }
                      >
                        <SelectTrigger id={`carrier-${line.id}`} className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CARRIER_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 回線数 */}
                    <div className="col-span-3">
                      <div className="relative">
                        <Input
                          id={`quantity-${line.id}`}
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.id, "quantity", e.target.value)
                          }
                          placeholder="100"
                          className="h-9 pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          枚
                        </span>
                      </div>
                    </div>

                    {/* 回線単価 */}
                    <div className="col-span-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          ¥
                        </span>
                        <Input
                          id={`unitPrice-${line.id}`}
                          type="number"
                          min="0"
                          value={line.unitPrice}
                          onChange={(e) =>
                            updateLine(line.id, "unitPrice", e.target.value)
                          }
                          placeholder="1,000"
                          className="h-9 pl-6"
                        />
                      </div>
                    </div>

                    {/* 小計 */}
                    <div className="col-span-2">
                      <div className="h-9 px-3 py-2 bg-gray-100 border rounded-md text-sm font-bold flex items-center justify-end">
                        ¥{calculateSubtotal(line).toLocaleString()}
                      </div>
                    </div>

                    {/* 削除ボタン */}
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length === 1}
                        className="h-9 w-9 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 小計と請求金額 */}
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">小計</span>
                <span className="text-lg font-medium text-gray-900">
                  ¥{calculateSubtotalSum().toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">
                請求金額 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ¥
                </span>
                <Input
                  id="totalAmount"
                  type="text"
                  value={totalAmount}
                  onChange={(e) => {
                    setTotalAmount(formatCurrency(e.target.value));
                  }}
                  placeholder="3,800,000"
                  className="pl-8 text-lg font-semibold"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                ※ 小計とは異なる場合があります（値引き・追加費用等）
              </p>
            </div>
          </div>

          {/* 備考 */}
          <div className="space-y-2">
            <Label htmlFor="note">備考</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="備考があれば入力してください"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={!isValid || createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  作成中...
                </>
              ) : (
                "発注を作成"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
