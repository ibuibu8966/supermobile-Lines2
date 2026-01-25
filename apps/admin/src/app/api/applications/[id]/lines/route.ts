import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

// 回線一覧取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "申し込みが見つかりません" },
        { status: 404 }
      );
    }

    const lines = await prisma.applicationLine.findMany({
      where: { applicationId: id },
      include: {
        sim: {
          include: {
            simLocationTag: true,
          },
        },
        lineTag: true,
        lineReserveTag: true,
      },
      orderBy: {
        lineNumber: "asc",
      },
    });

    return NextResponse.json(lines);
  } catch (error) {
    console.error("回線一覧取得エラー:", error);
    return NextResponse.json(
      { error: "回線一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
