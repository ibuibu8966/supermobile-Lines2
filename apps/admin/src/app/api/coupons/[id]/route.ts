import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { updateCoupon, deleteCoupon, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

// 更新
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await updateCoupon(id, request, prisma);
});

// 削除
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await deleteCoupon(id, prisma);
});
