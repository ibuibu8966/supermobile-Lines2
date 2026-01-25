import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

// 申込一覧を取得
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

    const where: Record<string, unknown> = {
      serviceId: service.id,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { applicationNumber: { contains: search } },
        {
          customer: {
            OR: [
              { lastName: { contains: search } },
              { firstName: { contains: search } },
              { email: { contains: search } },
              { companyName: { contains: search } },
            ],
          },
        },
      ];
    }

    const [applications, totalCount] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          customer: true,
          plan: true,
          lines: {
            include: {
              sim: {
                include: {
                  simLocationTag: true,
                },
              },
              lineTag: true,
              lineReserveTag: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.application.count({ where }),
    ]);

    return NextResponse.json({
      applications: applications.map((app) => ({
        id: app.id,
        applicationNumber: app.applicationNumber,
        customer: {
          id: app.customer.id,
          type: app.customer.type,
          name: app.customer.type === "CORPORATE"
            ? app.customer.companyName
            : app.customer.lastName + " " + app.customer.firstName,
          email: app.customer.email,
        },
        plan: {
          id: app.plan.id,
          name: app.plan.name,
        },
        lineCount: app.lineCount,
        unitPrice: app.unitPrice,
        totalAmount: app.totalAmount,
        status: app.status,
        paidAt: app.paidAt,
        createdAt: app.createdAt,
        lines: app.lines.map((line) => ({
          id: line.id,
          lineNumber: line.lineNumber,
          simId: line.simId,
          msisdn: line.msisdn,
          status: line.status,
          shippedAt: line.shippedAt,
          contractMonth: line.contractMonth,
          lineTag: line.lineTag,
          lineReserveTag: line.lineReserveTag,
          sim: line.sim ? {
            iccid: line.sim.iccid,
            msisdn: line.sim.msisdn,
            simLocationTag: line.sim.simLocationTag,
          } : null,
        })),
      })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("申込一覧取得エラー:", error);
    return NextResponse.json(
      { error: "申込一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
