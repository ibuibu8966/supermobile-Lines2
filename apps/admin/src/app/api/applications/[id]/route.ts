import { NextRequest, NextResponse } from "next/server";
import { prisma, getSignedUrl } from "@repo/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateApplicationSchema = z.object({
  status: z.enum([
    "SUBMITTED",
    "KYC_PENDING",
    "KYC_APPROVED",
    "KYC_REJECTED",
    "PAYMENT_PENDING",
    "PAID",
    "SHIPPING",
    "COMPLETED",
    "CANCELLED",
  ]).optional(),
  comment1: z.string().max(1000).optional().nullable(),
  comment2: z.string().max(1000).optional().nullable(),
  note: z.string().optional().nullable(),
});

// 詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        customer: true,
        service: true,
        plan: true,
        lines: {
          include: {
            sim: {
              include: {
                simLocationTag: true,
              },
            },
            lineTag: true,
            lineReserveTag: true,
          },
          orderBy: {
            lineNumber: "asc",
          },
        },
        kycImages: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "申し込みが見つかりません" },
        { status: 404 }
      );
    }

    // 回線統計を計算
    const shippedCount = application.lines.filter(
      (l) => l.status === "SHIPPED" || l.status === "ACTIVE"
    ).length;
    const unassignedCount = application.lines.filter(
      (l) => l.status === "UNASSIGNED"
    ).length;
    const returnedCount = application.lines.filter(
      (l) => l.status === "RETURNED"
    ).length;

    // 最新の有効期限を取得
    const expiryDates = application.kycImages
      .filter((img) => img.expiryDate)
      .map((img) => img.expiryDate);
    const latestExpiryDate = expiryDates.length > 0
      ? expiryDates.reduce((a, b) => (a! > b! ? a : b))
      : null;

    // KYC画像に署名付きURLを追加
    const kycImagesWithUrls = await Promise.all(
      application.kycImages.map(async (img) => {
        const signedUrl = await getSignedUrl("kyc", img.storagePath);
        return {
          ...img,
          signedUrl,
        };
      })
    );

    return NextResponse.json({
      ...application,
      kycImages: kycImagesWithUrls,
      stats: {
        lineCount: application.lineCount,
        shippedCount,
        unassignedCount,
        returnedCount,
      },
      latestExpiryDate,
    });
  } catch (error) {
    console.error("申し込み詳細取得エラー:", error);
    return NextResponse.json(
      { error: "申し込み詳細の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateApplicationSchema.parse(body);

    const existing = await prisma.application.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "申し込みが見つかりません" },
        { status: 404 }
      );
    }

    const application = await prisma.application.update({
      where: { id },
      data: validated,
      include: {
        customer: true,
        service: true,
        plan: true,
      },
    });

    return NextResponse.json(application);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("申し込み更新エラー:", error);
    return NextResponse.json(
      { error: "申し込みの更新に失敗しました" },
      { status: 500 }
    );
  }
}
