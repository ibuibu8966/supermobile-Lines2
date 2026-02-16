import { NextRequest } from "next/server";
import { prisma, getSignedUrl } from "@repo/database";
import { getAdminSession, assertServiceAccess } from "@/lib/admin-session";
import { getApplicationById, updateApplication, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

// 詳細取得
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await getApplicationById(id, prisma, getAdminSession, assertServiceAccess, getSignedUrl);
});

// 更新
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await updateApplication(id, request, prisma, getAdminSession, assertServiceAccess);
});
