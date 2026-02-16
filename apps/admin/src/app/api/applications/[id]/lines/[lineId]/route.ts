import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { getApplicationLineDetail, updateApplicationLine, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

// 回線詳細取得
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) => {
  const { id, lineId } = await params;
  return await getApplicationLineDetail(id, lineId, prisma);
});

// 回線更新
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) => {
  const { id, lineId } = await params;
  return await updateApplicationLine(id, lineId, request, prisma);
});
