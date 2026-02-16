import { NextRequest } from "next/server";
import { prisma, getSignedUrl } from "@repo/database";
import { getKycImageDetail, updateKycImage } from "@repo/shared";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return await getKycImageDetail(id, prisma, getSignedUrl);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return await updateKycImage(id, request, prisma);
}
