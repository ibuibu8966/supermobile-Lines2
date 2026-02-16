import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { getAllSims, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request: NextRequest) => {
  return await getAllSims(request, prisma);
});
