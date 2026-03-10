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
    const { updates } = await request.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "updates is required" }, { status: 400 });
    }

    const results = await Promise.all(
      updates.map(async ({ id, ...data }: { id: string; kycStatus?: string; paymentStatus?: string }) => {
        try {
          await prisma.application.update({
            where: { id },
            data,
          });
          return { id, success: true };
        } catch {
          return { id, success: false };
        }
      })
    );

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
