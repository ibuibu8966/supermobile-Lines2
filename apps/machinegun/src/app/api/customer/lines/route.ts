import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

// 顧客の契約回線一覧を取得
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
      return NextResponse.json(
        { error: "顧客情報が見つかりません" },
        { status: 404 }
      );
    }

    // 顧客の全申込から回線を取得
    const lines = await prisma.applicationLine.findMany({
      where: {
        application: {
          customerId: customer.id,
        },
      },
      include: {
        application: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ lines });
  } catch (error) {
    console.error("回線一覧取得エラー:", error);
    return NextResponse.json(
      { error: "回線一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
