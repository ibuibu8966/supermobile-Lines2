/**
 * Procurement Repository
 *
 * 発注データのデータアクセス層
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../shared/utils/logger';

export interface PurchaseOrderCreateInput {
  supplierId: number;
  totalAmount: number;
  note?: string | null;
  lines: {
    carrierType: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

export interface PurchaseOrderUpdateInput {
  status?: string;
  invoiceDate?: Date | null;
  deliveryDate?: Date | null;
  totalAmount?: number;
}

export interface PurchaseOrderInclude {
  supplier?: boolean | {
    select?: {
      id?: boolean;
      name?: boolean;
      code?: boolean;
    };
  };
  lines?: boolean;
  _count?: {
    select?: {
      sims?: boolean;
    };
  };
}

/**
 * 発注リポジトリ
 */
export class ProcurementRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 発注一覧を取得
   * パフォーマンス最適化: 1クエリで全データ取得
   */
  async findMany(include?: PurchaseOrderInclude): Promise<any[]> {
    logger.debug('発注一覧取得');

    // Raw SQLで1クエリに統合（パフォーマンス最適化）
    const ordersData = await this.prisma.$queryRaw`
      SELECT
        po.id,
        po."supplierId",
        po."totalAmount",
        po.status,
        po."orderedAt",
        po."invoiceDate",
        po."deliveryDate",
        po."purchaseOrderImagePath",
        po."quoteImagePath",
        po."invoiceImagePath",
        po.note,
        po."createdAt",
        po."updatedAt",
        s.id as "supplier_id",
        s.name as "supplier_name",
        s.code as "supplier_code",
        COALESCE(sim_count.count, 0)::int as "_count_sims"
      FROM "PurchaseOrder" po
      LEFT JOIN "Supplier" s ON po."supplierId" = s.id
      LEFT JOIN (
        SELECT "purchaseOrderId", COUNT(*)::int as count
        FROM "Sim"
        GROUP BY "purchaseOrderId"
      ) sim_count ON po.id = sim_count."purchaseOrderId"
      ORDER BY po."orderedAt" DESC
    ` as any[];

    // linesを別途取得（これは避けられない）
    const orderIds = ordersData.map((o: any) => o.id);
    const lines = orderIds.length > 0 ? await this.prisma.purchaseOrderLine.findMany({
      where: { purchaseOrderId: { in: orderIds } },
    }) : [];

    // データを整形
    const orders = ordersData.map((order: any) => ({
      id: order.id,
      supplierId: order.supplierId,
      totalAmount: order.totalAmount,
      status: order.status,
      orderedAt: order.orderedAt,
      invoiceDate: order.invoiceDate,
      deliveryDate: order.deliveryDate,
      purchaseOrderImagePath: order.purchaseOrderImagePath,
      quoteImagePath: order.quoteImagePath,
      invoiceImagePath: order.invoiceImagePath,
      note: order.note,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      supplier: {
        id: order.supplier_id,
        name: order.supplier_name,
        code: order.supplier_code,
      },
      lines: lines.filter((l: any) => l.purchaseOrderId === order.id),
      _count: {
        sims: order._count_sims,
      },
    }));

    logger.debug('発注一覧取得完了', { count: orders.length });

    return orders;
  }

  /**
   * 発注を作成
   */
  async create(
    data: PurchaseOrderCreateInput,
    include?: PurchaseOrderInclude
  ): Promise<any> {
    logger.info('発注作成開始', { supplierId: data.supplierId });

    const order = await this.prisma.purchaseOrder.create({
      data: {
        supplierId: data.supplierId,
        totalAmount: data.totalAmount,
        note: data.note || null,
        lines: {
          create: data.lines as any,
        },
      },
      include: include || {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        lines: true,
      },
    });

    logger.info('発注作成完了', { id: order.id });

    return order;
  }

  /**
   * 発注を取得（IDで）
   */
  async findById(id: string): Promise<any | null> {
    logger.debug('発注取得', { id });

    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        lines: true,
      },
    });

    return order;
  }

  /**
   * 発注を更新
   */
  async update(
    id: string,
    data: PurchaseOrderUpdateInput,
    include?: PurchaseOrderInclude
  ): Promise<any> {
    logger.info('発注更新開始', { id });

    const order = await this.prisma.purchaseOrder.update({
      where: { id },
      data: data as any,
      include: include || {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        lines: true,
      },
    });

    logger.info('発注更新完了', { id });

    return order;
  }

  /**
   * 発注の画像パスを更新
   */
  async updateImagePath(
    id: string,
    fieldName: string,
    url: string
  ): Promise<any> {
    logger.info('発注画像パス更新', { id, fieldName });

    const order = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        [fieldName]: url,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        lines: true,
      },
    });

    logger.info('発注画像パス更新完了', { id });

    return order;
  }
}
