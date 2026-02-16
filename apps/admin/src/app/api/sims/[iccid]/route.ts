import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { getSimDetail, updateSim, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

// 詳細取得
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ iccid: string }> }
) => {
  const { iccid } = await params;
  return await getSimDetail(iccid, prisma);
});

// 更新
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ iccid: string }> }
) => {
  const { iccid } = await params;
  return await updateSim(iccid, request, prisma);
});
