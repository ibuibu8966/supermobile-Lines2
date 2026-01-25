import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

const updateSimLocationTagSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// 詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tagId = parseInt(id);

    if (isNaN(tagId)) {
      return NextResponse.json(
        { error: "無効なIDです" },
        { status: 400 }
      );
    }

    const simLocationTag = await prisma.simLocationTag.findUnique({
      where: { id: tagId },
      include: {
        _count: {
          select: {
            sims: true,
          },
        },
      },
    });

    if (!simLocationTag) {
      return NextResponse.json(
        { error: "SIMの場所タグが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(simLocationTag);
  } catch (error) {
    console.error("SIMの場所タグ詳細取得エラー:", error);
    return NextResponse.json(
      { error: "SIMの場所タグの取得に失敗しました" },
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
    const tagId = parseInt(id);

    if (isNaN(tagId)) {
      return NextResponse.json(
        { error: "無効なIDです" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = updateSimLocationTagSchema.parse(body);

    // コードの重複チェック（自分以外）
    if (validated.code) {
      const existing = await prisma.simLocationTag.findFirst({
        where: {
          code: validated.code,
          id: { not: tagId },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "このコードは既に使用されています" },
          { status: 400 }
        );
      }
    }

    const simLocationTag = await prisma.simLocationTag.update({
      where: { id: tagId },
      data: validated,
    });

    return NextResponse.json(simLocationTag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("SIMの場所タグ更新エラー:", error);
    return NextResponse.json(
      { error: "SIMの場所タグの更新に失敗しました" },
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
    const tagId = parseInt(id);

    if (isNaN(tagId)) {
      return NextResponse.json(
        { error: "無効なIDです" },
        { status: 400 }
      );
    }

    // 使用中のチェック
    const usageCount = await prisma.sim.count({
      where: { simLocationTagId: tagId },
    });

    if (usageCount > 0) {
      // 論理削除
      await prisma.simLocationTag.update({
        where: { id: tagId },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "SIMの場所タグを無効化しました" });
    }

    await prisma.simLocationTag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ message: "SIMの場所タグを削除しました" });
  } catch (error) {
    console.error("SIMの場所タグ削除エラー:", error);
    return NextResponse.json(
      { error: "SIMの場所タグの削除に失敗しました" },
      { status: 500 }
    );
  }
}
