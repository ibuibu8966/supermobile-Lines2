import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

const lineTagSchema = z.object({
  code: z.string().min(1, "コードは必須です").max(50),
  name: z.string().min(1, "名前は必須です").max(100),
  displayOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

// 一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where = includeInactive ? {} : { isActive: true };

    const lineTags = await prisma.lineTag.findMany({
      where,
      include: {
        _count: {
          select: {
            applicationLines: true,
          },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(lineTags);
  } catch (error) {
    console.error("回線タグ一覧取得エラー:", error);
    return NextResponse.json(
      { error: "回線タグ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 新規作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = lineTagSchema.parse(body);

    // コードの重複チェック
    const existing = await prisma.lineTag.findUnique({
      where: { code: validated.code },
    });
    if (existing) {
      return NextResponse.json(
        { error: "このコードは既に使用されています" },
        { status: 400 }
      );
    }

    const lineTag = await prisma.lineTag.create({
      data: validated,
    });

    return NextResponse.json(lineTag, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("回線タグ作成エラー:", error);
    return NextResponse.json(
      { error: "回線タグの作成に失敗しました" },
      { status: 500 }
    );
  }
}
