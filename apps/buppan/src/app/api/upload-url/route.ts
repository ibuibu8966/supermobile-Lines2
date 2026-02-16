import { NextRequest } from "next/server";
import { createSignedUploadUrl } from "@repo/database";
import { createUploadUrl } from "@repo/shared";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return await createUploadUrl(request, createSignedUploadUrl);
}
