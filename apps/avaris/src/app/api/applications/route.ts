import { NextRequest } from "next/server";
import { prisma, uploadFile } from "@repo/database";
import { hashPassword } from "@repo/auth";
import { createCustomerApplication, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

// 申込作成
export const POST = withErrorHandling(async (request: NextRequest) => {
  return await createCustomerApplication(
    'avaris',
    request,
    prisma,
    hashPassword,
    uploadFile
  );
});
