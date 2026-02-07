import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

// 発送待ち申込一覧を取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // 物販サービスを取得
    const service = await prisma.service.findUnique({
      where: { code: "maeda" },
    });

    if (!service) {
      return NextResponse.json(
        { error: "サービスが見つかりません" },
        { status: 404 }
      );
    }

    // PAID状態の申込を取得（入金確認済み = 発送待ち）
    const where = {
      serviceId: service.id,
      status: "PAID" as const,
    };

    const [applications, totalCount] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          customer: true,
          plan: {
            include: {
              usageTags: {
                include: {
                  usageTag: true,
                },
              },
            },
          },
          lines: {
            include: {
              sim: true,
            },
            orderBy: { lineNumber: "asc" },
          },
        },
        orderBy: { paidAt: "asc" },
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
          name:
            app.customer.type === "CORPORATE"
              ? app.customer.companyName
              : `${app.customer.lastName} ${app.customer.firstName}`,
          email: app.customer.email,
          phone: app.customer.phone,
          postalCode: app.customer.postalCode,
          prefecture: app.customer.prefecture,
          city: app.customer.city,
          address: app.customer.address,
          building: app.customer.building,
        },
        plan: {
          id: app.plan.id,
          name: app.plan.name,
          usageTags: app.plan.usageTags.map((ut) => ({
            id: ut.usageTag.id,
            code: ut.usageTag.code,
            name: ut.usageTag.name,
          })),
        },
        lineCount: app.lineCount,
        totalAmount: app.totalAmount,
        paidAt: app.paidAt,
        createdAt: app.createdAt,
        lines: app.lines.map((line) => ({
          id: line.id,
          lineNumber: line.lineNumber,
          simId: line.simId,
          msisdn: line.msisdn,
          status: line.status,
          sim: line.sim
            ? {
                iccid: line.sim.iccid,
                msisdn: line.sim.msisdn,
                carrierType: line.sim.carrierType,
                status: line.sim.status,
              }
            : null,
        })),
        // 割当済み回線数
        assignedCount: app.lines.filter((l) => l.simId).length,
      })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("発送待ち一覧取得エラー:", error);
    return NextResponse.json(
      { error: "発送待ち一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
