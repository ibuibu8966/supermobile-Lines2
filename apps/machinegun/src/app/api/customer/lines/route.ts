import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { getCustomerLines } from "@repo/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  return await getCustomerLines(prisma, auth);
}
