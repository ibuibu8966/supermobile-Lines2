import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { getAllPurchaseOrders, createPurchaseOrder } from "@/controllers/procurement.controller";

export const dynamic = "force-dynamic";

export async function GET() {
  return await getAllPurchaseOrders(prisma);
}

export async function POST(request: NextRequest) {
  return await createPurchaseOrder(request, prisma);
}
