import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { uploadPurchaseOrderImage, deletePurchaseOrderImage } from "@/controllers/procurement.controller";
import { supabaseStorage } from "@/lib/storage/supabase-storage";
import { IMAGE_TYPE_FIELD_MAP } from "@/lib/storage/constants";

export const dynamic = "force-dynamic";

const VALID_IMAGE_TYPES = ['purchaseOrder', 'quote', 'invoice'];

// 画像アップロード
export async function POST (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return await uploadPurchaseOrderImage(
    id,
    request,
    prisma,
    supabaseStorage,
    IMAGE_TYPE_FIELD_MAP,
    VALID_IMAGE_TYPES
  );
}

// 画像削除
export async function DELETE (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return await deletePurchaseOrderImage(
    id,
    request,
    prisma,
    supabaseStorage,
    IMAGE_TYPE_FIELD_MAP,
    VALID_IMAGE_TYPES
  );
}
