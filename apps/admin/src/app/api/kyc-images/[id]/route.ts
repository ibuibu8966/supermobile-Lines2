import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

// KYC画像更新スキーマ
const updateKycImageSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]).optional(),
  reviewNote: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
});

// KYC画像ステータスを更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateKycImageSchema.parse(body);

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

    // 有効期限のみの更新
    if (validated.expiryDate !== undefined && !validated.status) {
      const updatedKycImage = await prisma.kycImage.update({
        where: { id },
        data: {
          expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        },
      });
      return NextResponse.json({ kycImage: updatedKycImage });
    }

    if (!validated.status) {
      return NextResponse.json(
        { error: "statusまたはexpiryDateが必要です" },
        { status: 400 }
      );
    }

    // KYC画像を更新
    const updatedKycImage = await prisma.kycImage.update({
      where: { id },
      data: {
        status: validated.status,
        reviewNote: validated.reviewNote || null,
        reviewedAt: new Date(),
        ...(validated.expiryDate !== undefined && {
          expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        }),
      },
    });

    // 申込のkycStatusを更新
    const allKycImages = kycImage.application.kycImages.map((img) =>
      img.id === id ? { ...img, status: validated.status } : img
    );

    const hasRejected = allKycImages.some((img) => img.status === "REJECTED");
    const allApproved = allKycImages.every((img) => img.status === "APPROVED");

    type KycVerificationStatus = "PENDING" | "DEFICIENT" | "RESUBMIT" | "COMPLETED";
    let newKycStatus: KycVerificationStatus = "PENDING";
    if (hasRejected) {
      newKycStatus = "DEFICIENT";
    } else if (allApproved && allKycImages.length > 0) {
      newKycStatus = "COMPLETED";
    }

    await prisma.application.update({
      where: { id: kycImage.application.id },
      data: { kycStatus: newKycStatus },
    });

    return NextResponse.json({
      kycImage: updatedKycImage,
      kycStatus: newKycStatus,
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
