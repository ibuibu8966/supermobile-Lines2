"use client";

import { useState, Fragment } from "react";
import { NewProcurementDialog } from "@/components/procurement/new-procurement-dialog";
import { CsvImportDialog } from "@/components/procurement/csv-import-dialog";
import { SimHistoryTable } from "@/components/procurement/sim-history-dialog";
import { EditableAmountField } from "@/components/common/editable-amount-field";
import { EditableDateField } from "@/components/common/editable-date-field";
import { ImageUploadField } from "@/components/procurement/image-upload-field";
import { SupplierManager } from "@/components/suppliers/supplier-manager";
import { useProcurement } from "@/hooks/use-procurement";
import type { PurchaseOrder, PurchaseOrderLine } from "@/types/procurement";
import {
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@repo/ui";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Building2,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  ORDERED: "発注済",
  CONFIRMED: "発注",
  AWAITING_SEAL: "しぃさん印鑑待ち",
  BEFORE_PAYMENT: "振込前",
  AWAITING_DELIVERY: "納品待ち",
  DELIVERED: "納品済",
};

const STATUS_OPTIONS = [
  { value: "ORDERED", label: "発注済" },
  { value: "CONFIRMED", label: "発注" },
  { value: "AWAITING_SEAL", label: "しぃさん印鑑待ち" },
  { value: "BEFORE_PAYMENT", label: "振込前" },
  { value: "AWAITING_DELIVERY", label: "納品待ち" },
  { value: "DELIVERED", label: "納品済" },
];

const STATUS_COLORS: Record<string, string> = {
  ORDERED: "bg-blue-100 text-blue-800 border-blue-200",
  CONFIRMED: "bg-green-100 text-green-800 border-green-200",
  AWAITING_SEAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
  BEFORE_PAYMENT: "bg-orange-100 text-orange-800 border-orange-200",
  AWAITING_DELIVERY: "bg-purple-100 text-purple-800 border-purple-200",
  DELIVERED: "bg-gray-100 text-gray-800 border-gray-200",
};

const CARRIER_LABELS: Record<string, string> = {
  DOCOMO: "ドコモ",
  AU: "au",
  SOFTBANK: "ソフトバンク",
  RAKUTEN: "楽天モバイル",
};

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState("procurement");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [openSections, setOpenSections] = useState<Record<string, { docs: boolean; simHistory: boolean }>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvImportDialogOpen, setCsvImportDialogOpen] = useState(false);
  const [selectedOrderForImport, setSelectedOrderForImport] = useState<{
    id: string;
    supplierId: number;
  } | null>(null);
  const [showInactiveSuppliers, setShowInactiveSuppliers] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);

  const {
    orders,
    isLoading,
    error,
    updateMutation,
    uploadImageMutation,
    deleteImageMutation,
  } = useProcurement();

  const toggleRow = (orderId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
        // 展開時にセクションをデフォルトで開いた状態にする
        setOpenSections((s) => ({
          ...s,
          [orderId]: s[orderId] ?? { docs: true, simHistory: true },
        }));
      }
      return next;
    });
  };

  const toggleSection = (orderId: string, section: "docs" | "simHistory") => {
    setOpenSections((prev) => {
      const defaults = { docs: true, simHistory: true };
      const current = { ...defaults, ...prev[orderId] };
      return {
        ...prev,
        [orderId]: {
          ...current,
          [section]: !(current[section] ?? true),
        },
      };
    });
  };

  // 各フィールドの更新処理
  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateMutation.mutate({
      id: orderId,
      data: { status: newStatus },
    });
  };

  const handleInvoiceDateChange = (orderId: string, newDate: string) => {
    updateMutation.mutate({
      id: orderId,
      data: { invoiceDate: newDate || null },
    });
  };

  const handleDeliveryDateChange = (orderId: string, newDate: string) => {
    updateMutation.mutate({
      id: orderId,
      data: { deliveryDate: newDate || null },
    });
  };

  const handleTotalAmountChange = (orderId: string, newAmount: number) => {
    updateMutation.mutate({
      id: orderId,
      data: { totalAmount: newAmount },
    });
  };

  // 画像アップロード処理
  const handleImageUpload = async (
    orderId: string,
    imageType: string,
    file: File
  ) => {
    await uploadImageMutation.mutateAsync({ id: orderId, imageType, file });
  };

  // 画像削除処理
  const handleImageDelete = async (orderId: string, imageType: string) => {
    await deleteImageMutation.mutateAsync({ id: orderId, imageType });
  };

  // CSVインポートダイアログを開く
  const handleOpenCsvImport = (orderId: string, supplierId: number) => {
    setSelectedOrderForImport({ id: orderId, supplierId });
    setCsvImportDialogOpen(true);
  };

  // 回線数の合計を計算
  const getTotalQuantity = (lines: PurchaseOrderLine[]) => {
    return lines.reduce((sum, line) => sum + line.quantity, 0);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">仕入れ管理</h1>
      </div>

      <NewProcurementDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {selectedOrderForImport && (
        <CsvImportDialog
          open={csvImportDialogOpen}
          onOpenChange={setCsvImportDialogOpen}
          purchaseOrderId={selectedOrderForImport.id}
          supplierId={selectedOrderForImport.supplierId}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="procurement">
              <FileText className="h-4 w-4 mr-2" />
              仕入れ管理
            </TabsTrigger>
            <TabsTrigger value="suppliers">
              <Building2 className="h-4 w-4 mr-2" />
              仕入先
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
            {activeTab === "procurement" && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新規発注
              </Button>
            )}
            {activeTab === "suppliers" && (
              <>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={showInactiveSuppliers}
                    onChange={(e) => setShowInactiveSuppliers(e.target.checked)}
                    className="rounded"
                  />
                  無効な仕入れ先も表示
                </label>
                <Button onClick={() => setSupplierDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  新規仕入れ先登録
                </Button>
              </>
            )}
          </div>
        </div>

        <TabsContent value="procurement" className="mt-0">

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>仕入れ先</TableHead>
                    <TableHead className="text-right">回線数</TableHead>
                    <TableHead className="text-right">請求金額</TableHead>
                    <TableHead>請求日</TableHead>
                    <TableHead>納品日</TableHead>
                    <TableHead>ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!orders || orders.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        発注データがありません
                      </TableCell>
                    </TableRow>
                  )}
                  {Array.isArray(orders) && orders.map((order) => (
                    <Fragment key={order.id}>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell onClick={() => toggleRow(order.id)} className="cursor-pointer">
                          {expandedRows.has(order.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell>{order.supplier.name}</TableCell>
                        <TableCell className="text-right">{getTotalQuantity(order.lines).toLocaleString()}枚</TableCell>
                        <TableCell className="text-right font-medium">
                          <EditableAmountField
                            orderId={order.id}
                            value={order.totalAmount}
                            onSave={handleTotalAmountChange}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableDateField
                            orderId={order.id}
                            value={order.invoiceDate}
                            onSave={handleInvoiceDateChange}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableDateField
                            orderId={order.id}
                            value={order.deliveryDate}
                            onSave={handleDeliveryDateChange}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusChange(order.id, value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status]}`}>
                                  {STATUS_LABELS[order.status]}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[option.value]}`}>
                                    {option.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(order.id) && (
                        <TableRow key={`${order.id}-expanded`}>
                          <TableCell colSpan={7} className="bg-gray-50">
                            <div className="p-4 space-y-4">
                              {/* 回線詳細 */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3">回線詳細</h4>
                                {order.lines && order.lines.length > 0 ? (
                                  <div className="bg-white rounded-lg border border-gray-200">
                                    {/* テーブルヘッダー */}
                                    <div className="grid grid-cols-12 gap-4 p-4 bg-gray-100 border-b border-gray-200">
                                      <div className="col-span-3 text-xs font-medium text-gray-600">回線種別</div>
                                      <div className="col-span-3 text-xs font-medium text-gray-600 text-right">数量</div>
                                      <div className="col-span-3 text-xs font-medium text-gray-600 text-right">単価</div>
                                      <div className="col-span-3 text-xs font-medium text-gray-600 text-right">小計</div>
                                    </div>
                                    {/* データ行 */}
                                    <div className="divide-y divide-gray-200">
                                      {order.lines.map((line) => (
                                        <div key={line.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors">
                                          <div className="col-span-3 font-semibold text-gray-900 text-base">
                                            {CARRIER_LABELS[line.carrierType]}
                                          </div>
                                          <div className="col-span-3 text-gray-900 font-medium text-right">
                                            {line.quantity.toLocaleString()}<span className="text-gray-500 text-sm ml-1">枚</span>
                                          </div>
                                          <div className="col-span-3 text-gray-900 font-medium text-right">
                                            ¥{line.unitPrice.toLocaleString()}
                                          </div>
                                          <div className="col-span-3 font-bold text-gray-900 text-lg text-right">
                                            ¥{line.subtotal.toLocaleString()}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-t-2 border-gray-300">
                                      <div className="flex justify-between items-center">
                                        <span className="text-base font-semibold text-gray-700">請求金額</span>
                                        <span className="text-2xl font-bold text-gray-900">
                                          ¥{order.totalAmount.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">回線詳細がありません</p>
                                )}
                              </div>

                              {/* 書類セクション（トグル） */}
                              <div>
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 mb-2"
                                  onClick={() => toggleSection(order.id, "docs")}
                                >
                                  {(openSections[order.id]?.docs ?? true) ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                  書類
                                </button>
                                {(openSections[order.id]?.docs ?? true) && (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <ImageUploadField
                                        orderId={order.id}
                                        label="発注書"
                                        imageType="purchaseOrder"
                                        currentImageUrl={order.purchaseOrderImagePath}
                                        onUpload={handleImageUpload}
                                        onDelete={handleImageDelete}
                                        isUploading={uploadImageMutation.isPending}
                                      />
                                      <ImageUploadField
                                        orderId={order.id}
                                        label="見積書"
                                        imageType="quote"
                                        currentImageUrl={order.quoteImagePath}
                                        onUpload={handleImageUpload}
                                        onDelete={handleImageDelete}
                                        isUploading={uploadImageMutation.isPending}
                                      />
                                      <ImageUploadField
                                        orderId={order.id}
                                        label="請求書"
                                        imageType="invoice"
                                        currentImageUrl={order.invoiceImagePath}
                                        onUpload={handleImageUpload}
                                        onDelete={handleImageDelete}
                                        isUploading={uploadImageMutation.isPending}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* SIM履歴セクション（トグル） */}
                              <div>
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 mb-2"
                                  onClick={() => toggleSection(order.id, "simHistory")}
                                >
                                  {(openSections[order.id]?.simHistory ?? true) ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                  インポートSIM履歴
                                </button>
                                {(openSections[order.id]?.simHistory ?? true) && (
                                  <div className="space-y-2">
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenCsvImport(order.id, order.supplier.id)}
                                      >
                                        <FileText className="h-4 w-4 mr-2" />
                                        CSVインポート
                                      </Button>
                                    </div>
                                    <SimHistoryTable purchaseOrderId={order.id} />
                                  </div>
                                )}
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
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-0">
          <SupplierManager
            hideControls={true}
            showInactive={showInactiveSuppliers}
            onShowInactiveChange={setShowInactiveSuppliers}
            isCreateDialogOpen={supplierDialogOpen}
            onCreateDialogChange={setSupplierDialogOpen}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
