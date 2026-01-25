import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const carrier = searchParams.get("carrier") || "";
    const supplier = searchParams.get("supplier") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { iccid: { contains: search } },
        { msisdn: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (carrier) {
      where.carrierType = carrier;
    }

    if (supplier) {
      where.supplierId = parseInt(supplier);
    }

    const [sims, total] = await Promise.all([
      prisma.sim.findMany({
        where,
        include: {
          supplier: true,
          contracts: {
            include: {
              usageTags: {
                include: {
                  usageTag: true,
                },
              },
              customer: {
                select: {
                  id: true,
                  lastName: true,
                  firstName: true,
                  companyName: true,
                  type: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sim.count({ where }),
    ]);

    // 消費済みタグIDからタグ名を取得
    const allTagIds: number[] = [];
    for (const sim of sims) {
      allTagIds.push(...sim.consumedTagIds);
    }
    const uniqueTagIds = [...new Set(allTagIds)];

    const usageTags = uniqueTagIds.length > 0
      ? await prisma.usageTag.findMany({
          where: { id: { in: uniqueTagIds } },
        })
      : [];

    const tagMap = new Map<number, typeof usageTags[number]>();
    for (const tag of usageTags) {
      tagMap.set(tag.id, tag);
    }

    // SIMデータに消費済みタグ情報を追加
    const simsWithTags = sims.map((sim) => ({
      ...sim,
      consumedTags: sim.consumedTagIds.map((id: number) => tagMap.get(id)).filter(Boolean),
    }));

    return NextResponse.json({
      data: simsWithTags,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("SIM一覧取得エラー:", error);
    return NextResponse.json(
      { error: "SIM一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
