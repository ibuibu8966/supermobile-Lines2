"use client";

import { useState } from "react";
import { NewProcurementDialog } from "@/components/procurement/new-procurement-dialog";
import { SupplierManager } from "@/components/suppliers/supplier-manager";
import { ProcurementTable } from "./components/procurement-table";
import { useProcurement } from "@/hooks/use-procurement";
import type { PurchaseOrder, PurchaseOrderType } from "@/types/procurement";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  Plus,
  FileText,
  Building2,
  Receipt,
  Wallet,
  CreditCard,
  LayoutList,
} from "lucide-react";

const TAB_CONFIG = [
  { value: "all", label: "全て", icon: LayoutList, typeFilter: undefined },
  { value: "PURCHASE_ORDER", label: "仕入れ", icon: FileText, typeFilter: "PURCHASE_ORDER" as PurchaseOrderType },
  { value: "SUPPLIER_INVOICE", label: "支払い", icon: Receipt, typeFilter: "SUPPLIER_INVOICE" as PurchaseOrderType },
  { value: "EXPENSE", label: "経費", icon: Wallet, typeFilter: "EXPENSE" as PurchaseOrderType },
  { value: "CUSTOMER_INVOICE", label: "追加請求", icon: CreditCard, typeFilter: "CUSTOMER_INVOICE" as PurchaseOrderType },
  { value: "suppliers", label: "取引先/仕入先", icon: Building2, typeFilter: undefined },
] as const;

export function ProcurementClient() {
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [showInactiveSuppliers, setShowInactiveSuppliers] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);

  const typeFilter = activeTab !== "all" && activeTab !== "suppliers"
    ? (activeTab as PurchaseOrderType)
    : undefined;

  const {
    orders,
    isLoading,
    error,
    updateMutation,
    uploadImageMutation,
    deleteImageMutation,
  } = useProcurement(typeFilter);

  const handleUpdate = (id: string, data: Record<string, unknown>) => {
    updateMutation.mutate({ id, data });
  };

  const handleImageUpload = async (orderId: string, imageType: string, file: File) => {
    await uploadImageMutation.mutateAsync({ id: orderId, imageType, file });
  };

  const handleImageDelete = async (orderId: string, imageType: string) => {
    await deleteImageMutation.mutateAsync({ id: orderId, imageType });
  };

  const isDataTab = activeTab !== "suppliers";

  return (
    <div className="p-6 h-full flex flex-col">
      <NewProcurementDialog
        open={dialogOpen || !!editingOrder}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            setEditingOrder(null);
          }
        }}
        defaultType={typeFilter}
        editOrder={editingOrder || undefined}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="flex items-center gap-4">
            {isDataTab && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新規登録
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

        {/* データタブ（全て/発注/請求/経費/追加請求） */}
        {TAB_CONFIG.filter((t) => t.value !== "suppliers").map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0 flex-1 min-h-0">
            {isLoading ? (
              <TableSkeleton rows={10} cols={7} />
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">エラーが発生しました</p>
                <p className="text-sm text-muted-foreground mt-2">
                  データの取得に失敗しました。ページを再読み込みしてください。
                </p>
              </div>
            ) : (
              <ProcurementTable
                orders={orders || []}
                currentTab={activeTab}
                onUpdate={handleUpdate}
                onImageUpload={handleImageUpload}
                onImageDelete={handleImageDelete}
                isUploading={uploadImageMutation.isPending}
                onEdit={setEditingOrder}
              />
            )}
          </TabsContent>
        ))}

        {/* 仕入先タブ */}
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
