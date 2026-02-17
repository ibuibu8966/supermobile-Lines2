import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { updatePurchaseOrder } from "@/controllers/procurement.controller";

export const dynamic = "force-dynamic";

// 発注の部分更新（ステータス、請求日、納品日）
export async function PATCH (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return await updatePurchaseOrder(id, request, prisma);
}
