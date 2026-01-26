import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

const pricingSchema = z.object({
  minQuantity: z.number().int().min(1).default(1),
  maxQuantity: z.number().int().min(1).nullable().optional(),
  unitPrice: z.number().int().min(0),
  description: z.string().max(200).optional().nullable(),
});

const planSchema = z.object({
  serviceId: z.string().cuid("サービスを選択してください"),
  code: z.string().min(1, "コードは必須です").max(50),
  name: z.string().min(1, "名前は必須です").max(100),
  usageTagIds: z.array(z.number().int()).optional().default([]),
  pricings: z.array(pricingSchema).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

// 一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get("includeInactive") === "true";
    const serviceId = searchParams.get("serviceId");

    const where: Record<string, unknown> = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (serviceId) {
      where.serviceId = serviceId;
    }

    const plans = await prisma.plan.findMany({
      where,
      include: {
        service: true,
        usageTags: {
          include: {
            usageTag: true,
          },
        },
        pricings: {
          orderBy: { minQuantity: "asc" },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: [{ service: { name: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("プラン一覧取得エラー:", error);
    return NextResponse.json(
      { error: "プラン一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 新規作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = planSchema.parse(body);

    const { usageTagIds, pricings, ...planData } = validated;

    // コードの重複チェック（同一サービス内）
    const existing = await prisma.plan.findUnique({
      where: {
        serviceId_code: {
          serviceId: planData.serviceId,
          code: planData.code,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "このサービス内で同じコードが既に使用されています" },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        ...planData,
        usageTags: {
          create: usageTagIds.map((usageTagId) => ({
            usageTagId,
          })),
        },
        pricings: {
          create: pricings,
        },
      },
      include: {
        service: true,
        usageTags: {
          include: {
            usageTag: true,
          },
        },
        pricings: true,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("プラン作成エラー:", error);
    return NextResponse.json(
      { error: "プランの作成に失敗しました" },
      { status: 500 }
    );
  }
}
