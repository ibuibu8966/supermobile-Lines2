import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

const usageTagSchema = z.object({
  code: z.string().min(1, "コードは必須です").max(50),
  name: z.string().min(1, "名前は必須です").max(100),
  category: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  displayOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

// 一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where = includeInactive ? {} : { isActive: true };

    const usageTags = await prisma.usageTag.findMany({
      where,
      include: {
        _count: {
          select: {
            contractTags: true,
            rules: true,
          },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(usageTags);
  } catch (error) {
    console.error("用途タグ一覧取得エラー:", error);
    return NextResponse.json(
      { error: "用途タグ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 新規作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = usageTagSchema.parse(body);

    // コードの重複チェック
    const existing = await prisma.usageTag.findUnique({
      where: { code: validated.code },
    });
    if (existing) {
      return NextResponse.json(
        { error: "このコードは既に使用されています" },
        { status: 400 }
      );
    }

    const usageTag = await prisma.usageTag.create({
      data: validated,
    });

    return NextResponse.json(usageTag, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("用途タグ作成エラー:", error);
    return NextResponse.json(
      { error: "用途タグの作成に失敗しました" },
      { status: 500 }
    );
  }
}
