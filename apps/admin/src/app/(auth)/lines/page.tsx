import { prisma } from "@repo/database";
import { LinesClient } from "./lines-client";

export const metadata = {
  title: "総合回線管理 | SIM統合管理システム",
};

async function getInitialData() {
  try {
    const [lines, simLocationTags, lineReserveTags, total] = await Promise.all([
      prisma.applicationLine.findMany({
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
        take: 50,
      }),
      prisma.simLocationTag.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.lineReserveTag.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.applicationLine.count(),
    ]);

    return {
      data: lines,
      pagination: {
        page: 1,
        pageSize: 50,
        total,
        totalPages: Math.ceil(total / 50),
      },
      simLocationTags,
      lineReserveTags,
    };
  } catch (error) {
    console.error("Failed to fetch initial lines data:", error);
    return {
      data: [],
      pagination: {
        page: 1,
        pageSize: 50,
        total: 0,
        totalPages: 0,
      },
      simLocationTags: [],
      lineReserveTags: [],
    };
  }
}

export default async function LinesPage() {
  const initialData = await getInitialData();

  return <LinesClient initialData={initialData} />;
}
