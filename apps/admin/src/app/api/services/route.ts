import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

const serviceSchema = z.object({
  code: z.string().min(1, "コードは必須です").max(50),
  name: z.string().min(1, "名前は必須です").max(100),
  isActive: z.boolean().optional().default(true),
});

// 一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where = includeInactive ? {} : { isActive: true };

    const services = await prisma.service.findMany({
      where,
      include: {
        _count: {
          select: {
            plans: true,
            applications: true,
            users: true,
          },
        },
        plans: {
          where: { isActive: true },
          include: {
            usageTags: {
              include: {
                usageTag: true,
              },
            },
            pricings: {
              orderBy: [{ customerType: "asc" }, { minQuantity: "asc" }],
            },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("サービス一覧取得エラー:", error);
    return NextResponse.json(
      { error: "サービス一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 新規作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = serviceSchema.parse(body);

    // コードの重複チェック
    const existing = await prisma.service.findUnique({
      where: { code: validated.code },
    });
    if (existing) {
      return NextResponse.json(
        { error: "このコードは既に使用されています" },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: validated,
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("サービス作成エラー:", error);
    return NextResponse.json(
      { error: "サービスの作成に失敗しました" },
      { status: 500 }
    );
  }
}
