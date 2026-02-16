import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import bcrypt from "bcryptjs";
import { getAdminSession } from "@/lib/admin-session";
import { getAllUsers, createUser, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

// 一覧取得
export const GET = withErrorHandling(async (request: NextRequest) => {
  return await getAllUsers(request, prisma, getAdminSession);
});

// 新規作成
export const POST = withErrorHandling(async (request: NextRequest) => {
  return await createUser(
    request,
    prisma,
    getAdminSession,
    async (password: string) => bcrypt.hash(password, 10)
  );
});
