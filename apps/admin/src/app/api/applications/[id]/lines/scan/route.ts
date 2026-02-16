import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { scanIccids, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

// ICCID一括割当
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await scanIccids(id, request, prisma);
});
