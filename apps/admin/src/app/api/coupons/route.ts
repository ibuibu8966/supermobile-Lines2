import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

const couponSchema = z.object({
  code: z.string().min(1, "コードは必須です").max(50),
  planId: z.string().cuid("プランを選択してください"),
  unitPrice: z.number().int().min(0, "単価は0以上で入力してください"),
  description: z.string().max(200).optional().nullable(),
  maxUsages: z.number().int().min(1).optional().nullable(),
  validFrom: z.string().min(1, "有効開始日は必須です"),
  validUntil: z.string().min(1, "有効終了日は必須です"),
  isActive: z.boolean().optional().default(true),
});

// 一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: Record<string, unknown> = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    const coupons = await prisma.coupon.findMany({
      where,
      include: {
        plan: {
          include: {
            service: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("クーポン一覧取得エラー:", error);
    return NextResponse.json(
      { error: "クーポン一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 新規作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = couponSchema.parse(body);

    // コードの重複チェック
    const existing = await prisma.coupon.findUnique({
      where: { code: validated.code },
    });
    if (existing) {
      return NextResponse.json(
        { error: "このクーポンコードは既に使用されています" },
        { status: 400 }
      );
    }

    // プランの存在チェック
    const plan = await prisma.plan.findUnique({
      where: { id: validated.planId },
    });
    if (!plan) {
      return NextResponse.json(
        { error: "指定されたプランが見つかりません" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: validated.code,
        planId: validated.planId,
        unitPrice: validated.unitPrice,
        description: validated.description ?? null,
        maxUsages: validated.maxUsages ?? null,
        validFrom: new Date(validated.validFrom),
        validUntil: new Date(validated.validUntil),
        isActive: validated.isActive,
      },
      include: {
        plan: {
          include: {
            service: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("クーポン作成エラー:", error);
    return NextResponse.json(
      { error: "クーポンの作成に失敗しました" },
      { status: 500 }
    );
  }
}
