import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { getTagDetail, updateTag, deleteTag, withErrorHandling, TagConfig } from "@repo/shared";

export const dynamic = "force-dynamic";

const config: TagConfig = {
  tableName: 'lineReserveTag',
  displayName: '回線予備タグ',
  usageTableName: 'applicationLine',
  usageColumnName: 'lineReserveTagId',
  includeFields: {
    _count: {
      select: {
        applicationLines: true,
      },
    },
  },
};

// 詳細取得
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await getTagDetail(id, prisma, config);
});

// 更新
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await updateTag(id, request, prisma, config);
});

// 削除
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return await deleteTag(id, prisma, config);
});
