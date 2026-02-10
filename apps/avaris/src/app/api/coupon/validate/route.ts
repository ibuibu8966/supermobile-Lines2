import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, planId } = body;

    if (!code || !planId) {
      return NextResponse.json(
        { valid: false, error: "クーポンコードとプランIDを指定してください" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: { plan: true },
    });

    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: "無効なクーポンコードです" }
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { valid: false, error: "このクーポンは現在ご利用いただけません" }
      );
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return NextResponse.json(
        { valid: false, error: "このクーポンは有効期間外です" }
      );
    }

    if (coupon.maxUsages !== null && coupon.usageCount >= coupon.maxUsages) {
      return NextResponse.json(
        { valid: false, error: "このクーポンは利用上限に達しています" }
      );
    }

    if (coupon.planId !== planId) {
      return NextResponse.json(
        { valid: false, error: "このクーポンは選択されたプランには適用できません" }
      );
    }

    return NextResponse.json({
      valid: true,
      unitPrice: coupon.unitPrice,
      description: coupon.description,
    });
  } catch (error) {
    console.error("クーポン検証エラー:", error);
    return NextResponse.json(
      { valid: false, error: "クーポンの検証に失敗しました" },
      { status: 500 }
    );
  }
}
