import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { bulkUpdateAllLines, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  return await bulkUpdateAllLines(request, prisma);
});
