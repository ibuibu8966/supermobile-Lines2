import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

// 発注一覧取得
export async function GET() {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            sims: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch purchase orders:", error);
    return NextResponse.json(
      { error: "発注一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 新規発注作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supplierId, carrierType, quantity, unitPrice, totalAmount, note } = body;

    // バリデーション
    if (!supplierId || !carrierType || !quantity || !unitPrice || !totalAmount) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    // 発注番号を自動生成 (PO-YYYYMMDD-XXX)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    // 今日の発注数を取得
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayOrdersCount = await prisma.purchaseOrder.count({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    const orderNumber = `PO-${dateStr}-${String(todayOrdersCount + 1).padStart(3, "0")}`;

    // 発注を作成
    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId,
        carrierType,
        quantity,
        unitPrice,
        totalAmount,
        note,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Failed to create purchase order:", error);
    return NextResponse.json(
      { error: "発注の作成に失敗しました" },
      { status: 500 }
    );
  }
}
