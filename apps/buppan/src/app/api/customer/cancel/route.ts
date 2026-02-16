import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { requestCancellation } from "@repo/shared";

export const dynamic = "force-dynamic";

// 解約申請
export async function POST(request: NextRequest) {
  return await requestCancellation(request, prisma, auth);
}
