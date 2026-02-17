import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { getApplicationLines } from "@/controllers/line.controller";

export const dynamic = "force-dynamic";

// 回線一覧取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return await getApplicationLines(id, prisma);
}
