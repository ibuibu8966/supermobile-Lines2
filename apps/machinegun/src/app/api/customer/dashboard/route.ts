import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { getCustomerDashboard } from "@repo/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  return await getCustomerDashboard(prisma, auth);
}
