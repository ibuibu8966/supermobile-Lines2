import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { hashPassword, verifyPassword } from "@repo/auth";
import { changePassword } from "@repo/shared";

export const dynamic = "force-dynamic";

// パスワード変更
export async function PUT(request: NextRequest) {
  return await changePassword(request, prisma, auth, verifyPassword, hashPassword);
}
