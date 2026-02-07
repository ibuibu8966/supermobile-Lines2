import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateLineSchema = z.object({
  simId: z.string().regex(/^[A-Z0-9]{15,20}$/, "ICCIDは15〜20桁の英数字（大文字）です").optional().nullable(),
  msisdn: z.string().regex(/^0\d{9,10}$/).optional().nullable(),
  status: z.enum([
    "NOT_ACTIVATED",
    "ACTIVATED",
    "SHIPPED",
    "RETURNED",
    "CANCELLED",
  ]).optional(),
  lineTagId: z.number().int().positive().optional().nullable(),
  lineReserveTagId: z.number().int().positive().optional().nullable(),
  contractMonth: z.coerce.date().optional().nullable(),
  shippedAt: z.coerce.date().optional().nullable(),
  returnedAt: z.coerce.date().optional().nullable(),
  note: z.string().optional().nullable(),
});

// 回線詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    const { id, lineId } = await params;

    const line = await prisma.applicationLine.findFirst({
      where: {
        id: lineId,
        applicationId: id,
      },
      include: {
        sim: {
          include: {
            simLocationTag: true,
          },
        },
        lineTag: true,
        lineReserveTag: true,
      },
    });

    if (!line) {
      return NextResponse.json(
        { error: "回線が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(line);
  } catch (error) {
    console.error("回線詳細取得エラー:", error);
    return NextResponse.json(
      { error: "回線詳細の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 回線更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    const { id, lineId } = await params;
    const body = await request.json();
    const validated = updateLineSchema.parse(body);

    const existing = await prisma.applicationLine.findFirst({
      where: {
        id: lineId,
        applicationId: id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "回線が見つかりません" },
        { status: 404 }
      );
    }

    // SIMの存在確認（存在しなくても登録可能）
    // SIMが存在しない場合でもICCIDは登録できるようにする

    // lineTagIdの存在確認
    if (validated.lineTagId) {
      const tag = await prisma.lineTag.findUnique({
        where: { id: validated.lineTagId },
      });
      if (!tag) {
        return NextResponse.json(
          { error: "指定された回線タグが見つかりません" },
          { status: 400 }
        );
      }
    }

    // lineReserveTagIdの存在確認
    if (validated.lineReserveTagId) {
      const tag = await prisma.lineReserveTag.findUnique({
        where: { id: validated.lineReserveTagId },
      });
      if (!tag) {
        return NextResponse.json(
          { error: "指定された回線予備タグが見つかりません" },
          { status: 400 }
        );
      }
    }

    const line = await prisma.applicationLine.update({
      where: { id: lineId },
      data: validated,
      include: {
        sim: {
          include: {
            simLocationTag: true,
          },
        },
        lineTag: true,
        lineReserveTag: true,
      },
    });

    return NextResponse.json(line);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("回線更新エラー:", error);
    return NextResponse.json(
      { error: "回線の更新に失敗しました" },
      { status: 500 }
    );
  }
}
