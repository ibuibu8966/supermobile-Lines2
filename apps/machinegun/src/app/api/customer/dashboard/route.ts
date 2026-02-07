import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const customer = await prisma.customer.findFirst({
      where: { userId: session.user.id },
    });

    if (!customer) {
      return NextResponse.json({
        customer: null,
        applications: [],
        lineStats: { active: 0, pending: 0, cancelled: 0 },
      });
    }

    const applications = await prisma.application.findMany({
      where: { customerId: customer.id },
      include: {
        plan: true,
        lines: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const allLines = applications.flatMap((app) => app.lines);
    const lineStats = {
      active: allLines.filter(
        (l) => l.status === "ACTIVATED" || l.status === "SHIPPED"
      ).length,
      pending: allLines.filter(
        (l) => l.status === "NOT_ACTIVATED" || l.status === "ACTIVATED"
      ).length,
      cancelled: allLines.filter(
        (l) => l.status === "CANCELLED" || l.status === "RETURNED"
      ).length,
    };

    return NextResponse.json({
      customer,
      applications,
      lineStats,
    });
  } catch (error) {
    console.error("ダッシュボード取得エラー:", error);
    return NextResponse.json(
      { error: "ダッシュボード情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
