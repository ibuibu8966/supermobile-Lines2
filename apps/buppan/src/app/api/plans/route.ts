import { prisma } from "@repo/database";
import { getServicePlans } from "@repo/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  return await getServicePlans(prisma, "buppan");
}
