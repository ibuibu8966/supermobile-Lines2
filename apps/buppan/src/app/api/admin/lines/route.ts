import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

// 回線一覧を取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // 物販サービスを取得
    const service = await prisma.service.findUnique({
      where: { code: "buppan" },
    });

    if (!service) {
      return NextResponse.json(
        { error: "サービスが見つかりません" },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      application: {
        serviceId: service.id,
      },
    };

    // ステータスフィルター
    if (status) {
      where.status = status;
    }

    // 検索フィルター（顧客名、電話番号、ICCID）
    if (search) {
      where.OR = [
        // ICCID
        { sim: { iccid: { contains: search, mode: "insensitive" } } },
        // MSISDN
        { sim: { msisdn: { contains: search, mode: "insensitive" } } },
        // 顧客名
        {
          application: {
            customer: {
              OR: [
                { lastName: { contains: search, mode: "insensitive" } },
                { firstName: { contains: search, mode: "insensitive" } },
                { companyName: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    const [lines, totalCount] = await Promise.all([
      prisma.applicationLine.findMany({
        where,
        include: {
          application: {
            include: {
              customer: {
                select: {
                  type: true,
                  lastName: true,
                  firstName: true,
                  companyName: true,
                  phone: true,
                },
              },
            },
          },
          sim: {
            select: {
              iccid: true,
              msisdn: true,
            },
          },
          lineTag: true,
          lineReserveTag: true,
        },
        orderBy: [
          { application: { createdAt: "desc" } },
          { lineNumber: "asc" },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.applicationLine.count({ where }),
    ]);

    return NextResponse.json({
      lines: lines.map((line) => ({
        id: line.id,
        lineNumber: line.lineNumber,
        status: line.status,
        shippedAt: line.shippedAt,
        returnedAt: line.returnedAt,
        contractMonth: line.contractMonth,
        application: {
          id: line.application.id,
          applicationNumber: line.application.applicationNumber,
          customer: {
            type: line.application.customer.type,
            name:
              line.application.customer.type === "CORPORATE"
                ? line.application.customer.companyName
                : `${line.application.customer.lastName} ${line.application.customer.firstName}`,
            phone: line.application.customer.phone,
          },
        },
        sim: line.sim
          ? {
              iccid: line.sim.iccid,
              msisdn: line.sim.msisdn,
            }
          : null,
        lineTag: line.lineTag,
        lineReserveTag: line.lineReserveTag,
      })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("回線一覧取得エラー:", error);
    return NextResponse.json(
      { error: "回線一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
