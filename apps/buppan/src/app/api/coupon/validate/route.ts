import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { validateCoupon } from "@repo/shared";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return await validateCoupon(request, prisma);
}
