import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { scanIccids } from "@/controllers/line-scan.controller";

export const dynamic = "force-dynamic";

// ICCID一括割当
export async function POST (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return await scanIccids(id, request, prisma);
}
