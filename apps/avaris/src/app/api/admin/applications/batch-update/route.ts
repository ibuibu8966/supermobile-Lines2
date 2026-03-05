import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { updates } = body as {
      updates: Array<{
        id: string;
        kycStatus?: string;
        paymentStatus?: string;
      }>;
    };

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const results = await Promise.all(
      updates.map(async ({ id, ...data }) => {
        return prisma.application.update({
          where: { id },
          data,
        });
      })
    );

    return NextResponse.json({ success: true, updated: results.length });
  } catch (error) {
    console.error("Batch update error:", error);
    return NextResponse.json({ error: "Batch update failed" }, { status: 500 });
  }
}
