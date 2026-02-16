import { NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 最適化: 必要最小限のデータのみ取得（単一クエリ）
    const overviewResult = await prisma.$queryRaw<
      Array<{ in_stock: bigint; active: bigint; returned: bigint }>
    >`
      SELECT
        (SELECT COUNT(*) FROM "Sim" WHERE status = 'IN_STOCK') as in_stock,
        (SELECT COUNT(*) FROM "ApplicationLine" WHERE status = 'ACTIVATED') as active,
        (SELECT COUNT(*) FROM "ApplicationLine" WHERE status = 'RETURNED') as returned
    `;

    return NextResponse.json({
      overview: {
        totalInStockSims: Number(overviewResult[0].in_stock),
        totalActiveLines: Number(overviewResult[0].active),
        totalReturningLines: Number(overviewResult[0].returned),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "統計データの取得に失敗しました" },
      { status: 500 }
    );
  }
}
