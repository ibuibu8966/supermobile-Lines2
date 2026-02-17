/**
 * Application Service
 *
 * 申込に関するビジネスロジックを担当
 * Repository層を使ってデータアクセスし、ビジネスルールを適用
 */

import { ApplicationRepository, ApplicationFilters } from '../repositories/application.repository';
import { ApplicationWithRelations, ApplicationCreateInput, ApplicationUpdateInput } from '@repo/entities';
import { PaginationInfo, createPaginationInfo } from '../shared/utils/helpers';
import { logger } from '../shared/utils/logger';
import { NotFoundError, ValidationError } from '../shared/errors/custom-errors';

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
}

export interface ApplicationListResult {
  applications: ApplicationWithRelations[];
  pagination: PaginationInfo;
}

export class ApplicationService {
  constructor(
    private applicationRepo: ApplicationRepository
  ) {}

  /**
   * 申込一覧を取得
   */
  async getApplicationList(
    filters: ApplicationFilters,
    pagination: PaginationParams,
    session: { scopedServiceId?: string | null }
  ): Promise<ApplicationListResult> {
    logger.info('申込一覧取得開始', { filters, pagination });

    // Repository経由でデータ取得
    const { applications, total } = await this.applicationRepo.findMany(
      filters,
      { skip: pagination.skip, take: pagination.pageSize },
      session.scopedServiceId
    );

    logger.debug('Repository取得完了', { count: applications.length, total });

    // 統計情報を計算
    const applicationsWithStats = applications.map((app: any) => {
      const lines = app.lines || [];
      const stats = {
        lineCount: lines.length,
        shippedCount: lines.filter((l: any) => l.status === 'SHIPPED' || l.status === 'ARRIVED' || l.status === 'ACTIVATED').length,
        notActivatedCount: lines.filter((l: any) => l.status === 'SHIPPED' || l.status === 'ARRIVED').length,
        returnedCount: lines.filter((l: any) => l.status === 'RETURNED').length,
      };
      return { ...app, stats };
    });

    // ページネーション情報生成
    const paginationInfo = createPaginationInfo(
      pagination.page,
      pagination.pageSize,
      total
    );

    logger.info('申込一覧取得完了', {
      resultCount: applicationsWithStats.length,
      totalPages: paginationInfo.totalPages,
    });

    return {
      applications: applicationsWithStats,
      pagination: paginationInfo,
    };
  }

  /**
   * 申込詳細を取得
   */
  async getApplicationById(id: string): Promise<ApplicationWithRelations | null> {
    logger.info('申込詳細取得', { id });

    const application = await this.applicationRepo.findById(id);

    if (!application) {
      logger.warn('申込が見つかりません', { id });
      return null;
    }

    logger.debug('申込詳細取得完了', { id });

    return application;
  }

  /**
   * 申込を作成
   */
  async createApplication(
    data: ApplicationCreateInput
  ): Promise<ApplicationWithRelations> {
    logger.info('申込作成開始', { data });

    const application = await this.applicationRepo.create(data);

    logger.info('申込作成完了', { id: application.id });

    return application;
  }

  /**
   * 申込を更新
   */
  async updateApplication(
    id: string,
    data: ApplicationUpdateInput
  ): Promise<ApplicationWithRelations> {
    logger.info('申込更新開始', { id, data });

    // 存在確認
    const existing = await this.applicationRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('申し込み');
    }

    // 更新実行
    const updated = await this.applicationRepo.update(id, data);

    logger.info('申込更新完了', { id });

    return updated;
  }
}
