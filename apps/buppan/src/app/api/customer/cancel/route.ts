import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

// 解約申請
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { lineId, reason } = body;

    if (!lineId) {
      return NextResponse.json(
        { error: "回線IDが必要です" },
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

    // 回線が顧客のものか確認
    const line = await prisma.applicationLine.findFirst({
      where: {
        id: lineId,
        application: {
          customerId: customer.id,
        },
      },
    });

    if (!line) {
      return NextResponse.json(
        { error: "回線が見つかりません" },
        { status: 404 }
      );
    }

    // 解約可能なステータスか確認
    if (line.status !== "ACTIVE" && line.status !== "SHIPPED") {
      return NextResponse.json(
        { error: "この回線は解約申請できません" },
        { status: 400 }
      );
    }

    // 回線のnoteに解約理由を追加し、ステータスを更新
    // 実際の解約処理は管理者が行う
    const now = new Date().toISOString();
    const cancelNote = reason
      ? `[${now}] 解約申請: ${reason}`
      : `[${now}] 解約申請`;

    await prisma.applicationLine.update({
      where: { id: lineId },
      data: {
        note: line.note ? `${line.note}\n${cancelNote}` : cancelNote,
        // ステータスは変更しない（管理者が処理する）
        // 管理画面で解約申請として表示するためにnoteを使用
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("解約申請エラー:", error);
    return NextResponse.json(
      { error: "解約申請に失敗しました" },
      { status: 500 }
    );
  }
}
