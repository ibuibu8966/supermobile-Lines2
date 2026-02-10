import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

// 追加申込作成
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, lineCount, couponCode } = body;

    // バリデーション
    if (!planId || !lineCount || lineCount < 10 || lineCount % 10 !== 0) {
      return NextResponse.json(
        { error: "プランと回線数を指定してください（回線数は10回線単位）" },
        { status: 400 }
      );
    }

    // ユーザーに紐づく顧客を取得
    const customer = await prisma.customer.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "顧客情報が見つかりません" },
        { status: 404 }
      );
    }

    // プラン取得（価格情報含む）
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        service: true,
        pricings: {
          orderBy: { minQuantity: "asc" },
        },
      },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: "選択されたプランは無効です" },
        { status: 400 }
      );
    }

    // 回線数に応じた単価を計算
    if (plan.pricings.length === 0) {
      return NextResponse.json(
        { error: "プランの価格設定が見つかりません" },
        { status: 400 }
      );
    }

    let unitPrice = plan.pricings[0].unitPrice;
    for (const pricing of plan.pricings) {
      if (lineCount >= pricing.minQuantity) {
        if (!pricing.maxQuantity || lineCount <= pricing.maxQuantity) {
          unitPrice = pricing.unitPrice;
        }
      }
    }

    // クーポン処理
    let couponId: string | null = null;
    let appliedCouponCode: string | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: couponCode, isActive: true },
      });
      if (coupon) {
        const now = new Date();
        if (
          coupon.planId === planId &&
          now >= coupon.validFrom &&
          now <= coupon.validUntil &&
          (coupon.maxUsages === null || coupon.usageCount < coupon.maxUsages)
        ) {
          unitPrice = coupon.unitPrice;
          couponId = coupon.id;
          appliedCouponCode = coupon.code;
        }
      }
    }

    // 申込番号生成
    const now = new Date();
    const dateStr = now
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const applicationNumber = `AP${dateStr}${randomNum}`;

    // 金額計算
    const totalAmount = unitPrice * lineCount;

    // 申込作成（トランザクション）
    const application = await prisma.$transaction(async (tx) => {
      // 申込作成（追加申込はKYC不要なのでkycStatusをCOMPLETEDに）
      const newApplication = await tx.application.create({
        data: {
          applicationNumber,
          customerId: customer.id,
          serviceId: plan.serviceId,
          planId: plan.id,
          lineCount,
          unitPrice,
          totalAmount,
          couponId,
          couponCode: appliedCouponCode,
          status: "SUBMITTED",
          kycStatus: "COMPLETED", // 追加申込は本人確認済み
        },
      });

      // 回線作成
      const linesData = Array.from({ length: lineCount }, (_, i) => ({
        applicationId: newApplication.id,
        lineNumber: i + 1,
        status: "NOT_ACTIVATED" as const,
      }));
      await tx.applicationLine.createMany({ data: linesData });

      // クーポン利用回数を更新
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      return newApplication;
    });

    return NextResponse.json({
      success: true,
      applicationNumber: application.applicationNumber,
    });
  } catch (error) {
    console.error("追加申込作成エラー:", error);
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json(
      { error: "申込の作成に失敗しました", details: errorMessage },
      { status: 500 }
    );
  }
}

// 申込履歴取得
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // ユーザーに紐づく顧客を取得
    const customer = await prisma.customer.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!customer) {
      return NextResponse.json({ applications: [] });
    }

    // 申込履歴取得
    const applications = await prisma.application.findMany({
      where: {
        customerId: customer.id,
      },
      include: {
        plan: true,
        lines: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("申込履歴取得エラー:", error);
    return NextResponse.json(
      { error: "申込履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}
