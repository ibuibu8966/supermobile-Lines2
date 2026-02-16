import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { completeShipping } from "@repo/shared";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return await completeShipping(request, prisma);
}
