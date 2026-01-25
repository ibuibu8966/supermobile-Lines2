import { NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

// 管理画面ダッシュボード情報を取得
export async function GET() {
  try {
    // 物販サービスを取得
    const service = await prisma.service.findUnique({
      where: { code: "buppan" },
    });

    if (!service) {
      return NextResponse.json(
        { error: "サービスが見つかりません" },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 本日の申込数
    const todayApplicationCount = await prisma.application.count({
      where: {
        serviceId: service.id,
        createdAt: { gte: today },
      },
    });

    // KYC待ち件数
    const kycPendingCount = await prisma.application.count({
      where: {
        serviceId: service.id,
        status: "KYC_PENDING",
      },
    });

    // 発送待ち件数（入金確認済み）
    const shippingPendingCount = await prisma.application.count({
      where: {
        serviceId: service.id,
        status: "PAID",
      },
    });

    // アクティブ顧客数（COMPLETED状態の申込がある顧客）
    const activeCustomers = await prisma.application.groupBy({
      by: ["customerId"],
      where: {
        serviceId: service.id,
        status: "COMPLETED",
      },
    });

    // 最新の申込一覧
    const recentApplications = await prisma.application.findMany({
      where: { serviceId: service.id },
      include: {
        customer: true,
        plan: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // KYC確認待ち一覧
    const kycPendingList = await prisma.application.findMany({
      where: {
        serviceId: service.id,
        status: "KYC_PENDING",
      },
      include: {
        customer: true,
        kycImages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    });

    return NextResponse.json({
      stats: {
        todayApplicationCount,
        kycPendingCount,
        shippingPendingCount,
        activeCustomerCount: activeCustomers.length,
      },
      recentApplications: recentApplications.map((app) => ({
        id: app.id,
        applicationNumber: app.applicationNumber,
        customerName: app.customer.type === "CORPORATE"
          ? app.customer.companyName
          : app.customer.lastName + app.customer.firstName,
        planName: app.plan.name,
        lineCount: app.lineCount,
        status: app.status,
        createdAt: app.createdAt,
      })),
      kycPendingList: kycPendingList.map((app) => ({
        id: app.id,
        applicationNumber: app.applicationNumber,
        customerName: app.customer.lastName + app.customer.firstName,
        documentType: app.kycImages[0]?.type || "未提出",
        createdAt: app.createdAt,
      })),
    });
  } catch (error) {
    console.error("管理画面ダッシュボード取得エラー:", error);
    return NextResponse.json(
      { error: "ダッシュボード情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
