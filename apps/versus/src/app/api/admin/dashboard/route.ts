import { prisma } from "@repo/database";
import { getDashboard } from "@repo/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  return await getDashboard("versus", prisma);
}
