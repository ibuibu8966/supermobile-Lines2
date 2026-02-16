import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { getUserDetail, updateUser, deleteUser, withErrorHandling } from "@repo/shared";
import { getAdminSession, assertServiceAccess } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// 詳細取得
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await getUserDetail(id, prisma, getAdminSession, assertServiceAccess);
});

// 更新
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await updateUser(id, request, prisma, getAdminSession, assertServiceAccess);
});

// 削除
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await deleteUser(id, prisma, getAdminSession, assertServiceAccess);
});
