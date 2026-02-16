import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { getAdminSession } from "@/lib/admin-session";
import { getAllApplications, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

// 全サービス統合一覧取得
export const GET = withErrorHandling(async (request: NextRequest) => {
  return await getAllApplications(request, prisma, getAdminSession);
});
