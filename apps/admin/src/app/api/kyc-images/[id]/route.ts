import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { updateKycImage, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

// KYC画像ステータスを更新
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await updateKycImage(id, request, prisma);
});
