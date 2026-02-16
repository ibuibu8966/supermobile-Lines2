import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { getAllLines } from "@repo/shared";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return await getAllLines("buppan", request, prisma);
}
