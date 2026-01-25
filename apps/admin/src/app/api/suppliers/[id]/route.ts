import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

const updateSupplierSchema = z.object({
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
    const supplierId = parseInt(id);

    if (isNaN(supplierId)) {
      return NextResponse.json(
        { error: "無効なIDです" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        _count: {
          select: { sims: true },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "仕入れ先が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("仕入れ先詳細取得エラー:", error);
    return NextResponse.json(
      { error: "仕入れ先の取得に失敗しました" },
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
    const supplierId = parseInt(id);

    if (isNaN(supplierId)) {
      return NextResponse.json(
        { error: "無効なIDです" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = updateSupplierSchema.parse(body);

    // コードの重複チェック（自分以外）
    if (validated.code) {
      const existing = await prisma.supplier.findFirst({
        where: {
          code: validated.code,
          id: { not: supplierId },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "このコードは既に使用されています" },
          { status: 400 }
        );
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: validated,
    });

    return NextResponse.json(supplier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("仕入れ先更新エラー:", error);
    return NextResponse.json(
      { error: "仕入れ先の更新に失敗しました" },
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
    const supplierId = parseInt(id);

    if (isNaN(supplierId)) {
      return NextResponse.json(
        { error: "無効なIDです" },
        { status: 400 }
      );
    }

    // SIMが紐付いている場合は論理削除
    const simCount = await prisma.sim.count({
      where: { supplierId },
    });

    if (simCount > 0) {
      await prisma.supplier.update({
        where: { id: supplierId },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "仕入れ先を無効化しました" });
    }

    await prisma.supplier.delete({
      where: { id: supplierId },
    });

    return NextResponse.json({ message: "仕入れ先を削除しました" });
  } catch (error) {
    console.error("仕入れ先削除エラー:", error);
    return NextResponse.json(
      { error: "仕入れ先の削除に失敗しました" },
      { status: 500 }
    );
  }
}
