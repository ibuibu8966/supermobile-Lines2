import { NextRequest } from "next/server";
import { prisma, getSignedUrl } from "@repo/database";
import { getKycList } from "@repo/shared";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return await getKycList("versus", request, prisma, getSignedUrl);
}
