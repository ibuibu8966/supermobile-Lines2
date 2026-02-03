import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

// KYC画像登録スキーマ
const kycImageSchema = z.object({
  type: z.enum(["ID_FRONT", "ID_BACK", "SELFIE", "ADDRESS_PROOF"]),
  storagePath: z.string().min(1, "ストレージパスは必須です"),
});

// KYC画像一覧を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { error: "申込が見つかりません" },
        { status: 404 }
      );
    }

    const kycImages = await prisma.kycImage.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ kycImages });
  } catch (error) {
    console.error("KYC画像一覧取得エラー:", error);
    return NextResponse.json(
      { error: "KYC画像一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// KYC画像を登録
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = kycImageSchema.parse(body);

    // 申込の存在確認
    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { error: "申込が見つかりません" },
        { status: 404 }
      );
    }

    // 同じタイプの既存画像があれば更新、なければ新規作成
    const existingImage = await prisma.kycImage.findFirst({
      where: {
        applicationId: id,
        type: validated.type,
      },
    });

    let kycImage;
    if (existingImage) {
      kycImage = await prisma.kycImage.update({
        where: { id: existingImage.id },
        data: {
          storagePath: validated.storagePath,
          status: "PENDING",
          reviewedAt: null,
          reviewNote: null,
        },
      });
    } else {
      kycImage = await prisma.kycImage.create({
        data: {
          applicationId: id,
          type: validated.type,
          storagePath: validated.storagePath,
          status: "PENDING",
        },
      });
    }

    // 申込ステータスはSUBMITTEDのまま維持（KYC確認待ち状態）
    // KYC画像登録時にステータス変更は不要

    return NextResponse.json(kycImage, { status: existingImage ? 200 : 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("KYC画像登録エラー:", error);
    return NextResponse.json(
      { error: "KYC画像の登録に失敗しました" },
      { status: 500 }
    );
  }
}
