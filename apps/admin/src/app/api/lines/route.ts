import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { getAllLines, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request: NextRequest) => {
  return await getAllLines(request, prisma);
});
