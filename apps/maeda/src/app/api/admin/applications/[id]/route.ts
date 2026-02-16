import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { getApplicationDetail, updateApplication } from "@repo/shared";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return await getApplicationDetail(request, params, prisma);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return await updateApplication(request, params, prisma);
}
