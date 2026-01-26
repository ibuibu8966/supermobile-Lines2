import { NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

// 物販サービスのプラン一覧を取得
export async function GET() {
  try {
    // 物販サービスを取得
    const service = await prisma.service.findUnique({
      where: { code: "buppan" },
    });

    if (!service) {
      return NextResponse.json(
        { error: "サービスが見つかりません" },
        { status: 404 }
      );
    }

    const plans = await prisma.plan.findMany({
      where: {
        serviceId: service.id,
        isActive: true,
      },
      include: {
        usageTags: {
          include: {
            usageTag: true,
          },
        },
        pricings: {
          orderBy: { minQuantity: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("プラン一覧取得エラー:", error);
    return NextResponse.json(
      { error: "プラン一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
