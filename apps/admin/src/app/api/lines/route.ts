import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const skip = (page - 1) * pageSize;

    // Filters
    const search = searchParams.get("search") || "";
    const simLocationTagIds = searchParams.get("simLocationTagIds")?.split(",").filter(Boolean).map(Number) || [];
    const lineReserveTagIds = searchParams.get("lineReserveTagIds")?.split(",").filter(Boolean).map(Number) || [];
    const statuses = searchParams.get("statuses")?.split(",").filter(Boolean) || [];
    const shippedFrom = searchParams.get("shippedFrom");
    const shippedTo = searchParams.get("shippedTo");
    const returnedFrom = searchParams.get("returnedFrom");
    const returnedTo = searchParams.get("returnedTo");

    // Build where clause
    const where: any = {};

    // Search filter (customer name, company name, phone number, ICCID)
    if (search) {
      where.OR = [
        // ICCID
        { simId: { contains: search, mode: "insensitive" } },
        // Phone number
        { msisdn: { contains: search, mode: "insensitive" } },
        // Customer name/company
        {
          application: {
            customer: {
              OR: [
                { lastName: { contains: search, mode: "insensitive" } },
                { firstName: { contains: search, mode: "insensitive" } },
                { companyName: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    // SIM location filter (via Sim)
    if (simLocationTagIds.length > 0) {
      where.sim = {
        simLocationTagId: { in: simLocationTagIds },
      };
    }

    // Line reserve tag filter
    if (lineReserveTagIds.length > 0) {
      where.lineReserveTagId = { in: lineReserveTagIds };
    }

    // Status filter
    if (statuses.length > 0) {
      where.status = { in: statuses };
    }

    // Shipped date range
    if (shippedFrom || shippedTo) {
      where.shippedAt = {};
      if (shippedFrom) where.shippedAt.gte = new Date(shippedFrom);
      if (shippedTo) where.shippedAt.lte = new Date(shippedTo);
    }

    // Returned date range
    if (returnedFrom || returnedTo) {
      where.returnedAt = {};
      if (returnedFrom) where.returnedAt.gte = new Date(returnedFrom);
      if (returnedTo) where.returnedAt.lte = new Date(returnedTo);
    }

    // Fetch data with pagination
    const [lines, total] = await Promise.all([
      prisma.applicationLine.findMany({
        where,
        include: {
          application: {
            include: {
              customer: {
                select: {
                  lastName: true,
                  firstName: true,
                  companyName: true,
                  type: true,
                  lastNameKana: true,
                  firstNameKana: true,
                  companyNameKana: true,
                  postalCode: true,
                  prefecture: true,
                  city: true,
                  address: true,
                  building: true,
                  email: true,
                  phone: true,
                },
              },
              service: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
              plan: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          sim: {
            select: {
              iccid: true,
              msisdn: true,
              carrierType: true,
              simLocationTag: true,
              simLocationTagId: true,
            },
          },
          lineReserveTag: true,
        },
        orderBy: [
          { application: { createdAt: "desc" } },
          { lineNumber: "asc" },
        ],
        skip,
        take: pageSize,
      }),
      prisma.applicationLine.count({ where }),
    ]);

    return NextResponse.json({
      data: lines,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Lines fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lines" },
      { status: 500 }
    );
  }
}
