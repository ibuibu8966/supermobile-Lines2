import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { getAllCoupons, createCoupon, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

// 一覧取得
export const GET = withErrorHandling(async (request: NextRequest) => {
  return await getAllCoupons(request, prisma);
});

// 新規作成
export const POST = withErrorHandling(async (request: NextRequest) => {
  return await createCoupon(request, prisma);
});
