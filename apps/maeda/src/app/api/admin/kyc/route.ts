import { NextRequest, NextResponse } from "next/server";
import { prisma, getSignedUrl, KycImageStatus } from "@repo/database";

export const dynamic = "force-dynamic";

// KYC確認待ち一覧を取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get("status") || "PENDING";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // 物販サービスを取得
    const service = await prisma.service.findUnique({
      where: { code: "maeda" },
    });

    if (!service) {
      return NextResponse.json(
        { error: "サービスが見つかりません" },
        { status: 404 }
      );
    }

    // SUBMITTED状態の申込を取得（KYC確認待ち）
    const where: Record<string, unknown> = {
      serviceId: service.id,
      status: "SUBMITTED",
    };

    // KycImageStatusの型に変換
    const kycImageStatus = statusParam as KycImageStatus;

    const [applications, totalCount] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          customer: true,
          plan: true,
          kycImages: {
            where: statusParam ? { status: kycImageStatus } : undefined,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.application.count({ where }),
    ]);

    // 署名付きURLを生成
    const applicationsWithUrls = await Promise.all(
      applications.map(async (app) => {
        const kycImagesWithUrls = await Promise.all(
          app.kycImages.map(async (img) => {
            const signedUrl = await getSignedUrl("kyc", img.storagePath);
            return {
              ...img,
              signedUrl,
            };
          })
        );

        return {
          id: app.id,
          applicationNumber: app.applicationNumber,
          customer: {
            id: app.customer.id,
            type: app.customer.type,
            name:
              app.customer.type === "CORPORATE"
                ? app.customer.companyName
                : `${app.customer.lastName} ${app.customer.firstName}`,
            email: app.customer.email,
            phone: app.customer.phone,
            birthDate: app.customer.birthDate,
            postalCode: app.customer.postalCode,
            prefecture: app.customer.prefecture,
            city: app.customer.city,
            address: app.customer.address,
            building: app.customer.building,
          },
          plan: {
            id: app.plan.id,
            name: app.plan.name,
          },
          lineCount: app.lineCount,
          totalAmount: app.totalAmount,
          status: app.status,
          createdAt: app.createdAt,
          kycImages: kycImagesWithUrls,
        };
      })
    );

    return NextResponse.json({
      applications: applicationsWithUrls,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("KYC確認待ち一覧取得エラー:", error);
    return NextResponse.json(
      { error: "KYC確認待ち一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
