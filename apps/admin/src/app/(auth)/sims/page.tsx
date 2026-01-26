import { prisma } from "@repo/database";
import { SimsClient } from "./sims-client";

interface SearchParams {
  search?: string;
  status?: string;
  carrier?: string;
  simLocation?: string;
  page?: string;
}

export default async function SimsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const pageSize = 50;

  // 検索条件を構築
  const where: Record<string, unknown> = {};

  if (params.search) {
    where.OR = [
      { iccid: { contains: params.search } },
      { msisdn: { contains: params.search } },
    ];
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.carrier) {
    where.carrierType = params.carrier;
  }

  if (params.simLocation) {
    where.simLocationTagId = parseInt(params.simLocation);
  }

  // 並列でデータ取得
  const [sims, total, simLocationTags, usageTags] = await Promise.all([
    prisma.sim.findMany({
      where,
      include: {
        supplier: true,
        simLocationTag: true,
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
    prisma.simLocationTag.findMany(),
    // 消費済みタグIDを取得するために、全SIMのconsumedTagIdsを集める必要があるが、
    // 初期表示では取得したSIMの分だけで十分
    prisma.usageTag.findMany(),
  ]);

  // 消費済みタグ情報をマップ
  const tagMap = new Map<number, (typeof usageTags)[number]>();
  for (const tag of usageTags) {
    tagMap.set(tag.id, tag);
  }

  // SIMデータを整形（Date→stringに変換）
  const simsWithTags = sims.map((sim) => ({
    iccid: sim.iccid,
    msisdn: sim.msisdn,
    simType: sim.simType,
    carrierType: sim.carrierType,
    status: sim.status,
    isMnpEligible: sim.isMnpEligible,
    supplier: {
      id: sim.supplier.id,
      code: sim.supplier.code,
      name: sim.supplier.name,
    },
    simLocationTag: sim.simLocationTag
      ? {
          id: sim.simLocationTag.id,
          code: sim.simLocationTag.code,
          name: sim.simLocationTag.name,
        }
      : null,
    simLocationTagId: sim.simLocationTagId,
    contracts: sim.contracts.map((contract) => ({
      id: contract.id,
      serviceName: contract.serviceName,
      contractStart: contract.contractStart?.toISOString() || null,
      contractEnd: contract.contractEnd?.toISOString() || null,
      status: contract.status,
      customer: contract.customer,
      usageTags: contract.usageTags.map((ut) => ({
        usageTag: {
          id: ut.usageTag.id,
          code: ut.usageTag.code,
          name: ut.usageTag.name,
        },
      })),
    })),
    consumedTags: sim.consumedTagIds
      .map((id: number) => tagMap.get(id))
      .filter(Boolean)
      .map((tag) => ({
        id: tag!.id,
        code: tag!.code,
        name: tag!.name,
      })),
  }));

  const initialData = {
    data: simsWithTags,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };

  const initialSimLocationTags = simLocationTags.map((tag) => ({
    id: tag.id,
    code: tag.code,
    name: tag.name,
  }));

  return (
    <SimsClient
      initialData={initialData}
      initialSimLocationTags={initialSimLocationTags}
    />
  );
}
