import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

// ステータス更新スキーマ
const updateStatusSchema = z.object({
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
  note: z.string().optional(),
  comment1: z.string().max(1000).optional().nullable(),
  comment2: z.string().max(1000).optional().nullable(),
});

// 申込詳細を取得
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
        plan: true,
        service: true,
        lines: {
          include: {
            sim: {
              include: {
                simLocationTag: true,
              },
            },
            contract: true,
            lineTag: true,
            lineReserveTag: true,
          },
        },
        kycImages: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "申込が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("申込詳細取得エラー:", error);
    return NextResponse.json(
      { error: "申込詳細の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 申込ステータスを更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateStatusSchema.parse(body);

    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { error: "申込が見つかりません" },
        { status: 404 }
      );
    }

    // ステータスに応じた追加処理
    const updateData: Record<string, unknown> = {};

    if (validated.status !== undefined) {
      updateData.status = validated.status;
    }

    if (validated.note !== undefined) {
      updateData.note = validated.note;
    }

    if (validated.comment1 !== undefined) {
      updateData.comment1 = validated.comment1;
    }

    if (validated.comment2 !== undefined) {
      updateData.comment2 = validated.comment2;
    }

    // 入金確認時は日時を記録
    if (validated.status === "PAID" && !application.paidAt) {
      updateData.paidAt = new Date();
    }

    const updated = await prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        plan: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("申込更新エラー:", error);
    return NextResponse.json(
      { error: "申込の更新に失敗しました" },
      { status: 500 }
    );
  }
}
