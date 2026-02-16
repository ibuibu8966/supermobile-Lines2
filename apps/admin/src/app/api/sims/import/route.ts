import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { simImportRowSchema } from "@repo/validation";
import { importSims, withErrorHandling } from "@repo/shared";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request: NextRequest) => {
  return await importSims(request, prisma, simImportRowSchema);
});
