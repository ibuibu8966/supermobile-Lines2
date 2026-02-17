/**
 * Procurement関連の型定義
 */

export interface PurchaseOrderLine {
  id: string;
  carrierType: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  supplier: {
    id: number;
    name: string;
  };
  lines: PurchaseOrderLine[];
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
