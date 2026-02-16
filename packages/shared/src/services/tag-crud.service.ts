/**
 * Tag CRUD Service
 *
 * タグ系エンティティの汎用CRUDビジネスロジック
 * 全てのタグ管理（UsageTag, LineTag, LineReserveTag, SimLocationTag）で共通のパターン
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../shared/utils/logger';
import { NotFoundError, ConflictError, ValidationError } from '../shared/errors/custom-errors';

export interface TagEntity {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  [key: string]: any;
}

export interface TagUpdateInput {
  code?: string;
  name?: string;
  category?: string | null;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  [key: string]: any;
}

export interface TagConfig {
  tableName: string;
  displayName: string;
  usageTableName?: string;
  usageColumnName?: string;
  includeFields?: any;
}

/**
 * 汎用タグCRUDサービス
 */
export class TagCrudService {
  constructor(
    private prisma: PrismaClient,
    private config: TagConfig
  ) {}

  /**
   * タグ詳細を取得
   */
  async getTagDetail(id: number): Promise<any> {
    logger.info(`${this.config.displayName}詳細取得`, { id });

    if (isNaN(id)) {
      throw new ValidationError('無効なIDです');
    }

    const tag = await (this.prisma as any)[this.config.tableName].findUnique({
      where: { id },
      include: this.config.includeFields || {},
    });

    if (!tag) {
      throw new NotFoundError(this.config.displayName, id.toString());
    }

    logger.debug(`${this.config.displayName}詳細取得完了`, { id });

    return tag;
  }

  /**
   * タグを更新
   * ビジネスルール: コードの重複チェック（自分以外）
   */
  async updateTag(id: number, updateData: TagUpdateInput): Promise<any> {
    logger.info(`${this.config.displayName}更新開始`, { id });

    if (isNaN(id)) {
      throw new ValidationError('無効なIDです');
    }

    // ビジネスルール: コードの重複チェック（自分以外）
    if (updateData.code) {
      const existing = await (this.prisma as any)[this.config.tableName].findFirst({
        where: {
          code: updateData.code,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictError('このコードは既に使用されています');
      }
    }

    const updated = await (this.prisma as any)[this.config.tableName].update({
      where: { id },
      data: updateData,
    });

    logger.info(`${this.config.displayName}更新完了`, { id });

    return updated;
  }

  /**
   * タグを削除
   * ビジネスルール:
   * - 使用中（関連データがある）の場合は論理削除（無効化）
   * - 使用されていない場合は物理削除
   */
  async deleteTag(id: number): Promise<{ deleted: boolean; message: string }> {
    logger.info(`${this.config.displayName}削除開始`, { id });

    if (isNaN(id)) {
      throw new ValidationError('無効なIDです');
    }

    // 使用中のチェック
    let usageCount = 0;
    if (this.config.usageTableName && this.config.usageColumnName) {
      usageCount = await (this.prisma as any)[this.config.usageTableName].count({
        where: { [this.config.usageColumnName]: id },
      });
    }

    // 使用中の場合は論理削除
    if (usageCount > 0) {
      logger.info('使用中のため論理削除', {
        id,
        usageCount,
      });
      await (this.prisma as any)[this.config.tableName].update({
        where: { id },
        data: { isActive: false },
      });
      return {
        deleted: false,
        message: `${this.config.displayName}を無効化しました`,
      };
    }

    // 物理削除
    await (this.prisma as any)[this.config.tableName].delete({
      where: { id },
    });

    logger.info(`${this.config.displayName}削除完了`, { id });
    return {
      deleted: true,
      message: `${this.config.displayName}を削除しました`,
    };
  }
}
