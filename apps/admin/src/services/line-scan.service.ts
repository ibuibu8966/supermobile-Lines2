/**
 * Line Scan Service
 *
 * 回線へのICCID一括割当に関するビジネスロジックを担当
 */

import { PrismaClient } from '@prisma/client';
import { LineScanInput, LineScanResult } from '@/entities';
import { logger } from '../shared/utils/logger';
import { NotFoundError, ValidationError } from '../shared/errors/custom-errors';

export class LineScanService {
  constructor(private prisma: PrismaClient) {}

  /**
   * ICCID一括割当
   * ビジネスロジック:
   * - 申込の未割当回線を取得
   * - ICCID重複チェック
   * - SIMの存在・ステータス確認（存在しない場合は警告のみ）
   * - タグの存在確認
   * - トランザクションで回線・SIM更新
   */
  async scanIccids(
    applicationId: string,
    input: LineScanInput
  ): Promise<LineScanResult> {
    logger.info('ICCID一括割当開始', {
      applicationId,
      iccidCount: input.iccids.length,
    });

    // 1. 申し込みの存在確認と未割当回線取得
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        lines: {
          where: { status: 'NOT_ACTIVATED' },
          orderBy: { lineNumber: 'asc' },
        },
      },
    });

    if (!application) {
      throw new NotFoundError('Application', applicationId);
    }

    const notActivatedLines = application.lines;

    if (notActivatedLines.length === 0) {
      throw new ValidationError('未割当の回線がありません');
    }

    // 2. ビジネスルール: ICCID重複チェック
    const uniqueIccids = [...new Set(input.iccids)];
    if (uniqueIccids.length !== input.iccids.length) {
      throw new ValidationError('重複したICCIDがあります');
    }

    // 3. ビジネスルール: SIMの存在・ステータス確認
    const sims = await this.prisma.sim.findMany({
      where: { iccid: { in: uniqueIccids } },
    });

    const simMap = new Map(sims.map((s) => [s.iccid, s]));
    const warnings: string[] = [];

    for (const iccid of uniqueIccids) {
      const sim = simMap.get(iccid);
      if (!sim) {
        // SIMが存在しない場合は警告のみ（エラーにしない）
        warnings.push(`ICCID ${iccid} はSIMマスタに未登録です`);
      }
    }

    // 4. ビジネスルール: 割当数の確認
    if (uniqueIccids.length > notActivatedLines.length) {
      throw new ValidationError(
        `未割当回線数(${notActivatedLines.length})より多くのICCIDが指定されています(${uniqueIccids.length})`
      );
    }

    // 5. タグの存在確認
    if (input.lineTagId) {
      const tag = await this.prisma.lineTag.findUnique({
        where: { id: input.lineTagId },
      });
      if (!tag) {
        throw new ValidationError('指定された回線タグが見つかりません');
      }
    }

    if (input.lineReserveTagId) {
      const tag = await this.prisma.lineReserveTag.findUnique({
        where: { id: input.lineReserveTagId },
      });
      if (!tag) {
        throw new ValidationError('指定された回線予備タグが見つかりません');
      }
    }

    // 6. トランザクションで一括更新（updateMany で N+1 を解消）
    const assignedLineIds = notActivatedLines
      .slice(0, uniqueIccids.length)
      .map((l) => l.id);

    // ICCID → 回線ID のマッピングを構築（iccidフィールドも保持して失敗時に特定できるようにする）
    const lineUpdateData = uniqueIccids.map((iccid, i) => {
      const line = notActivatedLines[i];
      const sim = simMap.get(iccid);
      return {
        iccid,
        lineId: line.id,
        simId: sim ? iccid : null,
        msisdn: sim?.msisdn || null,
      };
    });

    // 100件チャンクに分けてトランザクション実行（Supabaseタイムアウト対策）
    // チャンクごとに独立したトランザクションにすることで、1チャンク失敗しても他は成功を維持
    const CHUNK_SIZE = 100;
    const successLineIds: string[] = [];
    const failedIccids: string[] = [];

    for (let i = 0; i < lineUpdateData.length; i += CHUNK_SIZE) {
      const chunk = lineUpdateData.slice(i, i + CHUNK_SIZE);
      try {
        await this.prisma.$transaction(
          async (tx) => {
            await Promise.all(
              chunk.map(({ lineId, simId, msisdn }) =>
                tx.applicationLine.update({
                  where: { id: lineId },
                  data: {
                    simId,
                    msisdn,
                    status: 'ACTIVATED',
                    contractMonth: input.contractMonth,
                    lineTagId: input.lineTagId,
                    lineReserveTagId: input.lineReserveTagId,
                  },
                })
              )
            );
          },
          { timeout: 30_000 }
        );
        successLineIds.push(...chunk.map(({ lineId }) => lineId));
      } catch (err) {
        // このチャンクは失敗 → 対象ICCIDを失敗リストに追加（次の中間登録で再送可能）
        logger.error('チャンク登録失敗', { chunkStart: i, chunkSize: chunk.length, err });
        failedIccids.push(...chunk.map(({ iccid }) => iccid));
      }
    }

    // 更新後の回線データを取得（include 付き）
    const results = await this.prisma.applicationLine.findMany({
      where: { id: { in: successLineIds } },
      include: {
        sim: {
          include: {
            simLocationTag: true,
          },
        },
        lineTag: true,
        lineReserveTag: true,
      },
      orderBy: { lineNumber: 'asc' },
    });

    logger.info('ICCID一括割当完了', {
      applicationId,
      assignedCount: results.length,
      failedCount: failedIccids.length,
      warningCount: warnings.length,
    });

    const message = failedIccids.length > 0
      ? `${results.length}件登録成功、${failedIccids.length}件失敗しました`
      : `${results.length}件の回線にICCIDを割り当てました`;

    return {
      message,
      assignedCount: results.length,
      lines: results,
      warnings: warnings.length > 0 ? warnings : undefined,
      failedIccids: failedIccids.length > 0 ? failedIccids : undefined,
    };
  }
}
