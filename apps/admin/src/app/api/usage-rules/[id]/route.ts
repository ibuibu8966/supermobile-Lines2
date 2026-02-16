import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { getUsageRuleDetail, updateUsageRule, deleteUsageRule, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

// 詳細取得
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await getUsageRuleDetail(id, prisma);
});

// 更新
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await updateUsageRule(id, request, prisma);
});

// 削除
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await deleteUsageRule(id, prisma);
});
