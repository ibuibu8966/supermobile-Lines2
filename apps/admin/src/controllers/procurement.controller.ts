/**
 * Procurement Controller
 *
 * 発注管理のコントローラー層
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { ProcurementService } from '../services/procurement.service';
import { ProcurementSimImportService } from '../services/procurement-sim-import.service';
import { ImageUploadService, StorageClient } from '../services/image-upload.service';
import { logger } from '../shared/utils/logger';

// ==================== Validation Schemas ====================

const createPurchaseOrderSchema = z.object({
  supplierId: z.number().int().positive('仕入先IDは正の整数である必要があります'),
  totalAmount: z.number().positive('金額は正の数である必要があります').optional(),
  lines: z
    .array(
      z.object({
        carrierType: z.enum(['DOCOMO', 'AU', 'SOFTBANK', 'RAKUTEN']),
        quantity: z.number().int().positive('数量は正の整数である必要があります'),
        unitPrice: z.number().positive('単価は正の数である必要があります'),
      })
    )
    .min(1, '明細は1件以上必要です'),
  note: z.string().optional(),
});

const updatePurchaseOrderSchema = z.object({
  status: z
    .enum(['ORDERED', 'CONFIRMED', 'AWAITING_SEAL', 'BEFORE_PAYMENT', 'AWAITING_DELIVERY', 'DELIVERED'])
    .optional(),
  invoiceDate: z.string().nullable().optional(),
  deliveryDate: z.string().nullable().optional(),
  totalAmount: z.number().positive('金額は正の数である必要があります').optional(),
});

const importSimDataSchema = z.object({
  iccid: z.string().min(1, 'ICCIDは必須です'),
  msisdn: z.string().optional(),
  simType: z.enum(['INDIVIDUAL', 'CORPORATE', 'BOTH']).optional(),
  carrierType: z.enum(['DOCOMO', 'AU', 'SOFTBANK', 'RAKUTEN']).optional(),
  plan: z.string().optional(),
  supplierContractEnd: z.string().optional(),
  isAutoCancel: z.boolean().optional(),
  autoCancelDate: z.string().optional(),
  eligibleTagIds: z.array(z.number().int()).optional(),
});

const importSimsSchema = z.object({
  sims: z.array(importSimDataSchema).min(1, 'SIMデータは1件以上必要です'),
  supplierId: z.number().int().positive('仕入先IDは正の整数である必要があります'),
});

/**
 * 発注一覧を取得
 */
export async function getAllPurchaseOrders(prisma: PrismaClient): Promise<NextResponse> {
  const service = new ProcurementService(prisma);
  const orders = await service.getAllPurchaseOrders();
  return NextResponse.json(orders);
}

/**
 * 発注を作成
 */
export async function createPurchaseOrder(
  request: NextRequest,
  prisma: PrismaClient
): Promise<NextResponse> {
  const body = await request.json();
  const result = createPurchaseOrderSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'バリデーションエラー', details: result.error.flatten() },
      { status: 400 }
    );
  }
  const service = new ProcurementService(prisma);
  const order = await service.createPurchaseOrder(result.data);
  return NextResponse.json(order, { status: 201 });
}

/**
 * 発注を取得
 */
export async function getPurchaseOrderById(
  id: string,
  prisma: PrismaClient
): Promise<NextResponse> {
  const service = new ProcurementService(prisma);
  const order = await service.getPurchaseOrderById(id);
  return NextResponse.json(order);
}

/**
 * 発注を更新
 */
export async function updatePurchaseOrder(
  id: string,
  request: NextRequest,
  prisma: PrismaClient
): Promise<NextResponse> {
  const body = await request.json();
  const result = updatePurchaseOrderSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'バリデーションエラー', details: result.error.flatten() },
      { status: 400 }
    );
  }
  const service = new ProcurementService(prisma);
  const order = await service.updatePurchaseOrder(id, result.data);
  return NextResponse.json(order);
}

/**
 * 発注の画像をアップロード
 */
export async function uploadPurchaseOrderImage(
  id: string,
  request: NextRequest,
  prisma: PrismaClient,
  storageClient: StorageClient,
  imageTypeFieldMap: Record<string, string>,
  validImageTypes: string[]
): Promise<NextResponse> {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const imageType = formData.get('imageType') as string;

  // 必須パラメータチェック
  if (!file || !imageType) {
    return NextResponse.json(
      { error: 'ファイルと画像タイプが必要です' },
      { status: 400 }
    );
  }

  // 画像アップロードサービス
  const imageService = new ImageUploadService(storageClient);

  // 画像タイプのバリデーション
  if (!imageService.isValidImageType(imageType, validImageTypes)) {
    return NextResponse.json(
      { error: '無効な画像タイプです' },
      { status: 400 }
    );
  }

  // 発注を取得
  const procurementService = new ProcurementService(prisma);
  const order = await procurementService.getPurchaseOrderById(id);

  // フィールド名を取得
  const fieldName = imageTypeFieldMap[imageType];
  const existingUrl = (order as unknown as Record<string, unknown>)[fieldName] as string | null;

  // 画像をアップロード
  const uploadResult = await imageService.uploadImage(
    id,
    imageType,
    file,
    existingUrl
  );

  // データベースを更新
  const updatedOrder = await procurementService.updateImagePath(
    id,
    fieldName,
    uploadResult.url!
  );

  return NextResponse.json(updatedOrder);
}

/**
 * 発注にSIMを一括インポート
 */
export async function importSimsToPurchaseOrder(
  id: string,
  request: NextRequest,
  prisma: PrismaClient
): Promise<NextResponse> {
  const body = await request.json();
  const validation = importSimsSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'バリデーションエラー', details: validation.error.flatten() },
      { status: 400 }
    );
  }
  const service = new ProcurementSimImportService(prisma);
  const result = await service.importSims(id, validation.data);
  return NextResponse.json(result);
}

/**
 * 発注の画像を削除
 */
export async function deletePurchaseOrderImage(
  id: string,
  request: NextRequest,
  prisma: PrismaClient,
  storageClient: StorageClient,
  imageTypeFieldMap: Record<string, string>,
  validImageTypes: string[]
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const imageType = searchParams.get('imageType');

  // 必須パラメータチェック
  if (!imageType) {
    return NextResponse.json(
      { error: '画像タイプが必要です' },
      { status: 400 }
    );
  }

  // 画像アップロードサービス
  const imageService = new ImageUploadService(storageClient);

  // 画像タイプのバリデーション
  if (!imageService.isValidImageType(imageType, validImageTypes)) {
    return NextResponse.json(
      { error: '無効な画像タイプです' },
      { status: 400 }
    );
  }

  // 発注を取得
  const procurementService = new ProcurementService(prisma);
  const order = await procurementService.getPurchaseOrderById(id);

  // フィールド名を取得
  const fieldName = imageTypeFieldMap[imageType];
  const imageUrl = (order as unknown as Record<string, unknown>)[fieldName] as string | null;

  if (!imageUrl) {
    return NextResponse.json(
      { error: '削除する画像がありません' },
      { status: 404 }
    );
  }

  // 画像を削除
  await imageService.deleteImage(imageUrl, id);

  // データベースを更新（画像パスをnullにクリア）
  const updatedOrder = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      [fieldName]: null,
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

  return NextResponse.json(updatedOrder);
}

/**
 * 発注に紐づくSIM一覧を取得
 */
export async function getPurchaseOrderSims(
  id: string,
  prisma: PrismaClient
): Promise<NextResponse> {
  logger.info('発注SIM一覧取得開始', { purchaseOrderId: id });

  const sims = await prisma.sim.findMany({
    where: {
      purchaseOrderId: id,
    },
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      simLocationTag: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  logger.info('発注SIM一覧取得完了', { count: sims.length });
  return NextResponse.json(sims);
}
