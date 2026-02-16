import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { bulkUpdateApplicationLines, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

// 回線一括更新
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await bulkUpdateApplicationLines(id, request, prisma);
});
