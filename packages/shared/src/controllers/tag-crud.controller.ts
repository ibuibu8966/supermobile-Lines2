/**
 * Tag CRUD Controller
 *
 * タグ系エンティティの汎用CRUDコントローラー
 */

import { NextRequest, NextResponse } from 'next/server';
import { TagCrudService, TagConfig, TagUpdateInput } from '../services/tag-crud.service';
import { logger } from '../shared/utils/logger';
import { z } from 'zod';

// 汎用更新スキーマ
const updateTagSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  category: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * タグ詳細取得コントローラー
 */
export async function getTagDetail(
  id: string,
  prisma: any,
  config: TagConfig
): Promise<NextResponse> {
  const tagId = parseInt(id);
  const tagService = new TagCrudService(prisma, config);
  const tag = await tagService.getTagDetail(tagId);
  return NextResponse.json(tag);
}

/**
 * タグ更新コントローラー
 */
export async function updateTag(
  id: string,
  request: NextRequest,
  prisma: any,
  config: TagConfig
): Promise<NextResponse> {
  const tagId = parseInt(id);

  // バリデーション
  const body = await request.json();
  const validated = updateTagSchema.parse(body);

  // Service呼び出し
  const tagService = new TagCrudService(prisma, config);
  const updated = await tagService.updateTag(tagId, validated);

  return NextResponse.json(updated);
}

/**
 * タグ削除コントローラー
 */
export async function deleteTag(
  id: string,
  prisma: any,
  config: TagConfig
): Promise<NextResponse> {
  const tagId = parseInt(id);

  // Service呼び出し
  const tagService = new TagCrudService(prisma, config);
  const result = await tagService.deleteTag(tagId);

  return NextResponse.json(result);
}
