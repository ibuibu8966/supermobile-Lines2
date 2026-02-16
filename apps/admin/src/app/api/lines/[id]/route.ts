import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { updateLine, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await updateLine(id, request, prisma);
});
