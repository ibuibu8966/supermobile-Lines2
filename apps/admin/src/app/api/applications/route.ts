import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

// 全サービス統合一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const serviceId = searchParams.get("serviceId") || "";
    const customerType = searchParams.get("customerType") || "";
    const includeArchived = searchParams.get("includeArchived") === "true";
    const archivedOnly = searchParams.get("archivedOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    const where: Record<string, unknown> = {};

    // アーカイブフィルタリング
    if (archivedOnly) {
      // アーカイブのみ表示
      where.isArchived = true;
    } else if (!includeArchived) {
      // デフォルトでアーカイブ済みを除外
      where.isArchived = false;
    }

    if (search) {
      where.OR = [
        { applicationNumber: { contains: search } },
        { customer: { email: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { customer: { lastName: { contains: search } } },
        { customer: { firstName: { contains: search } } },
        { customer: { companyName: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (customerType) {
      where.customer = {
        ...((where.customer as Record<string, unknown>) || {}),
        type: customerType,
      };
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        select: {
          id: true,
          applicationNumber: true,
          status: true,
          kycStatus: true,
          paymentStatus: true,
          lineCount: true,
          unitPrice: true,
          totalAmount: true,
          comment1: true,
          comment2: true,
          isArchived: true,
          archivedAt: true,
          createdAt: true,
          customer: {
            select: {
              id: true,
              type: true,
              lastName: true,
              firstName: true,
              lastNameKana: true,
              firstNameKana: true,
              companyName: true,
              companyNameKana: true,
              email: true,
              phone: true,
            },
          },
          service: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          plan: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          lines: {
            select: {
              status: true,
            },
          },
          kycImages: {
            select: {
              id: true,
              type: true,
              storagePath: true,
              status: true,
              expiryDate: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.application.count({ where }),
    ]);

    // 回線統計を計算
    const applicationsWithStats = applications.map((app) => {
      const shippedCount = app.lines.filter(
        (l) => l.status === "SHIPPED" || l.status === "ACTIVATED"
      ).length;
      const notActivatedCount = app.lines.filter(
        (l) => l.status === "NOT_ACTIVATED"
      ).length;
      const returnedCount = app.lines.filter(
        (l) => l.status === "RETURNED"
      ).length;

      // 最新の有効期限を取得
      const expiryDates = app.kycImages
        .filter((img) => img.expiryDate)
        .map((img) => img.expiryDate);
      const latestExpiryDate = expiryDates.length > 0
        ? expiryDates.reduce((a, b) => (a! > b! ? a : b))
        : null;

      // linesを除外してレスポンスを構築
      const { lines: _, ...appWithoutLines } = app;

      return {
        ...appWithoutLines,
        stats: {
          lineCount: app.lineCount,
          shippedCount,
          notActivatedCount,
          returnedCount,
        },
        latestExpiryDate,
      };
    });

    return NextResponse.json({
      data: applicationsWithStats,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("申し込み一覧取得エラー:", error);
    return NextResponse.json(
      { error: "申し込み一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
