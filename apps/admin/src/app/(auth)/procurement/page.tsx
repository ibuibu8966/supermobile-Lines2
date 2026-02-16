"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Image as ImageIcon,
  Upload,
} from "lucide-react";

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: {
    id: number;
    name: string;
  };
  carrierType: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
  orderedAt: string;
  invoiceDate: string | null;
  deliveryDate: string | null;
  purchaseOrderImagePath: string | null;
  quoteImagePath: string | null;
  invoiceImagePath: string | null;
  note: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  ORDERED: "発注済",
  CONFIRMED: "発注",
  AWAITING_SEAL: "しぃさん印鑑待ち",
  BEFORE_PAYMENT: "振込前",
  AWAITING_DELIVERY: "納品待ち",
  DELIVERED: "納品済",
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ORDERED: "secondary",
  CONFIRMED: "default",
  AWAITING_SEAL: "outline",
  BEFORE_PAYMENT: "outline",
  AWAITING_DELIVERY: "default",
  DELIVERED: "secondary",
};

const CARRIER_LABELS: Record<string, string> = {
  DOCOMO: "ドコモ",
  AU: "au",
  SOFTBANK: "ソフトバンク",
  RAKUTEN: "楽天",
};

export default function ProcurementPage() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: orders, isLoading, error } = useQuery<PurchaseOrder[]>({
    queryKey: ["procurement"],
    queryFn: () => fetch("/api/procurement").then((r) => r.json()),
  });

  const toggleRow = (orderId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">エラーが発生しました</p>
          <p className="text-sm text-muted-foreground mt-2">
            データの取得に失敗しました。ページを再読み込みしてください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仕入れ管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            発注管理と納品管理
          </p>
        </div>
        <Link href="/procurement/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規発注
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>発注番号</TableHead>
                <TableHead>仕入れ先</TableHead>
                <TableHead>回線種別</TableHead>
                <TableHead className="text-right">回線数</TableHead>
                <TableHead className="text-right">単価</TableHead>
                <TableHead className="text-right">請求金額</TableHead>
                <TableHead>請求日</TableHead>
                <TableHead>納品日</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!orders || orders.length === 0) && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    発注データがありません
                  </TableCell>
                </TableRow>
              )}
              {Array.isArray(orders) && orders.map((order) => (
                <>
                  <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell onClick={() => toggleRow(order.id)}>
                      {expandedRows.has(order.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.supplier.name}</TableCell>
                    <TableCell>{CARRIER_LABELS[order.carrierType]}</TableCell>
                    <TableCell className="text-right">{order.quantity.toLocaleString()}枚</TableCell>
                    <TableCell className="text-right">¥{order.unitPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium">¥{order.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      {order.invoiceDate
                        ? new Date(order.invoiceDate).toLocaleDateString("ja-JP")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {order.deliveryDate
                        ? new Date(order.deliveryDate).toLocaleDateString("ja-JP")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[order.status]}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(order.id) && (
                    <TableRow>
                      <TableCell colSpan={10} className="bg-gray-50">
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                発注書
                              </label>
                              {order.purchaseOrderImagePath ? (
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="h-4 w-4 text-gray-400" />
                                  <a
                                    href={order.purchaseOrderImagePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    画像を表示
                                  </a>
                                </div>
                              ) : (
                                <Button variant="outline" size="sm">
                                  <Upload className="h-4 w-4 mr-2" />
                                  アップロード
                                </Button>
                              )}
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                見積書
                              </label>
                              {order.quoteImagePath ? (
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="h-4 w-4 text-gray-400" />
                                  <a
                                    href={order.quoteImagePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    画像を表示
                                  </a>
                                </div>
                              ) : (
                                <Button variant="outline" size="sm">
                                  <Upload className="h-4 w-4 mr-2" />
                                  アップロード
                                </Button>
                              )}
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                請求書
                              </label>
                              {order.invoiceImagePath ? (
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="h-4 w-4 text-gray-400" />
                                  <a
                                    href={order.invoiceImagePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    画像を表示
                                  </a>
                                </div>
                              ) : (
                                <Button variant="outline" size="sm">
                                  <Upload className="h-4 w-4 mr-2" />
                                  アップロード
                                </Button>
                              )}
                            </div>
                          </div>

                          <div>
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              CSVインポート
                            </Button>
                          </div>

                          {order.note && (
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                備考
                              </label>
                              <p className="text-sm text-gray-600">{order.note}</p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
