import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

// KYC画像ステータス更新スキーマ
const updateKycStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().optional(),
});

// KYC画像ステータスを更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateKycStatusSchema.parse(body);

    const kycImage = await prisma.kycImage.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            kycImages: true,
          },
        },
      },
    });

    if (!kycImage) {
      return NextResponse.json(
        { error: "KYC画像が見つかりません" },
        { status: 404 }
      );
    }

    // KYC画像を更新
    const updatedKycImage = await prisma.kycImage.update({
      where: { id },
      data: {
        status: validated.status,
        reviewNote: validated.reviewNote || null,
        reviewedAt: new Date(),
      },
    });

    // 申込のステータスを更新
    // すべてのKYC画像がAPPROVEDの場合、申込をKYC_APPROVEDに
    // 1つでもREJECTEDの場合、申込をKYC_REJECTEDに
    const allKycImages = kycImage.application.kycImages.map((img) =>
      img.id === id ? { ...img, status: validated.status } : img
    );

    const hasRejected = allKycImages.some((img) => img.status === "REJECTED");
    const allApproved = allKycImages.every((img) => img.status === "APPROVED");

    let newApplicationStatus = kycImage.application.status;
    if (hasRejected) {
      newApplicationStatus = "KYC_REJECTED";
    } else if (allApproved && allKycImages.length > 0) {
      newApplicationStatus = "KYC_APPROVED";
    }

    if (newApplicationStatus !== kycImage.application.status) {
      await prisma.application.update({
        where: { id: kycImage.application.id },
        data: { status: newApplicationStatus },
      });
    }

    return NextResponse.json({
      kycImage: updatedKycImage,
      applicationStatus: newApplicationStatus,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("KYC画像ステータス更新エラー:", error);
    return NextResponse.json(
      { error: "KYC画像ステータスの更新に失敗しました" },
      { status: 500 }
    );
  }
}
