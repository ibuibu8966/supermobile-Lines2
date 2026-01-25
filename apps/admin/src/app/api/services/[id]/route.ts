import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

const updateServiceSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

// 詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            plans: true,
            applications: true,
            users: true,
          },
        },
        plans: {
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
    });

    if (!service) {
      return NextResponse.json(
        { error: "サービスが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("サービス詳細取得エラー:", error);
    return NextResponse.json(
      { error: "サービスの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateServiceSchema.parse(body);

    // コードの重複チェック（自分以外）
    if (validated.code) {
      const existing = await prisma.service.findFirst({
        where: {
          code: validated.code,
          id: { not: id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "このコードは既に使用されています" },
          { status: 400 }
        );
      }
    }

    const service = await prisma.service.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("サービス更新エラー:", error);
    return NextResponse.json(
      { error: "サービスの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// 削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 関連データがあるかチェック
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            plans: true,
            applications: true,
            users: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "サービスが見つかりません" },
        { status: 404 }
      );
    }

    const totalRelated = service._count.plans + service._count.applications + service._count.users;

    if (totalRelated > 0) {
      // 論理削除
      await prisma.service.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "サービスを無効化しました" });
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ message: "サービスを削除しました" });
  } catch (error) {
    console.error("サービス削除エラー:", error);
    return NextResponse.json(
      { error: "サービスの削除に失敗しました" },
      { status: 500 }
    );
  }
}
