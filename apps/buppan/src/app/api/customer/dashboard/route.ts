import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

// ダッシュボード情報を取得（認証実装後はセッションからcustomerIdを取得）
export async function GET(request: NextRequest) {
  try {
    // 暫定: クエリパラメータからcustomerIdを取得（認証実装後は削除）
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 }
      );
    }

    // 顧客情報を取得
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "顧客が見つかりません" },
        { status: 404 }
      );
    }

    // 申込一覧を取得
    const applications = await prisma.application.findMany({
      where: { customerId },
      include: {
        plan: true,
        lines: {
          include: {
            sim: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 利用中の回線数を計算
    const activeLines = applications.flatMap((app) =>
      app.lines.filter((line) => line.status === "ACTIVATED")
    );

    // 月額料金を計算
    const monthlyTotal = applications
      .filter((app) => app.status === "COMPLETED" || app.status === "SHIPPING")
      .reduce((sum, app) => sum + app.totalAmount, 0);

    // ダッシュボードデータを返す
    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.lastName + " " + customer.firstName,
        email: customer.email,
        type: customer.type,
      },
      stats: {
        activeLineCount: activeLines.length,
        monthlyTotal,
        nextBillingDate: getNextBillingDate(),
      },
      applications: applications.map((app) => ({
        id: app.id,
        applicationNumber: app.applicationNumber,
        planName: app.plan.name,
        lineCount: app.lineCount,
        totalAmount: app.totalAmount,
        status: app.status,
        createdAt: app.createdAt,
        lines: app.lines.map((line) => ({
          id: line.id,
          lineNumber: line.lineNumber,
          msisdn: line.msisdn,
          status: line.status,
          simId: line.simId,
        })),
      })),
      activeLines: activeLines.map((line) => ({
        id: line.id,
        msisdn: line.msisdn || "未割当",
        planName: applications.find((a) => a.id === line.applicationId)?.plan.name || "",
        status: line.status,
      })),
    });
  } catch (error) {
    console.error("ダッシュボード取得エラー:", error);
    return NextResponse.json(
      { error: "ダッシュボード情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 次回請求日を計算（月末締め、翌月1日請求）
function getNextBillingDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return (nextMonth.getMonth() + 1) + "/1";
}
