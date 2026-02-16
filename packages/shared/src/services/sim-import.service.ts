/**
 * SIM Import Service
 *
 * SIM一括インポートに関するビジネスロジックを担当
 */

import { logger } from '../shared/utils/logger';

export interface ImportRow {
  iccid: string;
  msisdn?: string | null;
  supplier: string;
  simType?: string;
  carrierType?: string;
  plan?: string;
  isMnpEligible?: boolean | string;
  isAutoCancel?: boolean | string;
  autoCancelDate?: string;
  supplierContractStart?: string;
  supplierContractEnd?: string;
  eligibleTagIds?: number[];
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; iccid: string; error: string }>;
}

interface ValidatedRow {
  index: number;
  iccid: string;
  msisdn: string | null;
  supplierId: number;
  simType: 'INDIVIDUAL' | 'CORPORATE';
  carrierType: 'DOCOMO' | 'AU' | 'SOFTBANK' | 'RAKUTEN' | null;
  plan: string | null;
  isMnpEligible: boolean;
  isAutoCancel: boolean;
  autoCancelDate: Date | null;
  supplierContractStart: Date | null;
  supplierContractEnd: Date | null;
  eligibleTagIds: number[];
}

const BATCH_SIZE = 500;

export class SimImportService {
  constructor(
    private prisma: any,
    private simImportRowSchema: any
  ) {}

  /**
   * SIMを一括インポート
   * ビジネスルール:
   * - 仕入れ先がない場合は自動作成
   * - ICCID重複は最後の行を優先
   * - バルクUpsert優先、失敗時は個別処理にフォールバック
   */
  async importSims(rows: ImportRow[]): Promise<ImportResult> {
    logger.info('SIMインポート開始', { rowCount: rows.length });

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    if (!Array.isArray(rows) || rows.length === 0) {
      logger.warn('インポートデータが空です');
      throw new Error('インポートデータが空です');
    }

    // ビジネスルール: 仕入れ先コードからIDへのマッピング取得 + 自動作成
    const supplierMap = await this.resolveSuppliers(rows);

    // Phase 1: 全行バリデーション
    const validatedRows = this.validateRows(rows, supplierMap, result);

    if (validatedRows.length === 0) {
      logger.warn('有効な行がありません', { failedCount: result.failed });
      return result;
    }

    // ビジネスルール: ICCID重複除去（最後の行を優先）
    const uniqueRows = this.deduplicateByIccid(validatedRows);
    logger.debug('重複除去完了', { originalCount: validatedRows.length, uniqueCount: uniqueRows.length });

    // Phase 2: バッチUpsert
    await this.batchUpsert(uniqueRows, result);

    logger.info('SIMインポート完了', {
      success: result.success,
      failed: result.failed,
      errorCount: result.errors.length
    });

    return result;
  }

  /**
   * 仕入れ先コードをIDに解決（存在しない場合は自動作成）
   */
  private async resolveSuppliers(rows: ImportRow[]): Promise<Map<string, number>> {
    const supplierCodes = [...new Set(rows.map((r) => r.supplier))];

    logger.debug('仕入れ先解決開始', { codeCount: supplierCodes.length });

    const suppliers = await this.prisma.supplier.findMany({
      where: { code: { in: supplierCodes } },
    });

    const supplierMap = new Map<string, number>();
    for (const s of suppliers) {
      supplierMap.set(s.code, s.id);
    }

    // 存在しない仕入れ先を作成
    const missingCodes = supplierCodes.filter((code) => !supplierMap.has(code));
    if (missingCodes.length > 0) {
      logger.info('仕入れ先自動作成', { count: missingCodes.length, codes: missingCodes });

      const newSuppliers = await Promise.all(
        missingCodes.map((code) =>
          this.prisma.supplier.create({
            data: { code, name: code },
          })
        )
      );

      for (const s of newSuppliers) {
        supplierMap.set(s.code, s.id);
      }
    }

    return supplierMap;
  }

  /**
   * 全行をバリデーション
   */
  private validateRows(
    rows: ImportRow[],
    supplierMap: Map<string, number>,
    result: ImportResult
  ): ValidatedRow[] {
    const validatedRows: ValidatedRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const validated = this.simImportRowSchema.parse({
          ...row,
          isMnpEligible: row.isMnpEligible === true || row.isMnpEligible === 'true' || row.isMnpEligible === '1',
          isAutoCancel: row.isAutoCancel === true || row.isAutoCancel === 'true' || row.isAutoCancel === '1',
        });

        const supplierId = supplierMap.get(validated.supplier);
        if (!supplierId) {
          throw new Error(`仕入れ先「${validated.supplier}」が見つかりません`);
        }

        validatedRows.push({
          index: i,
          iccid: validated.iccid,
          msisdn: validated.msisdn ?? null,
          supplierId,
          simType: validated.simType as 'INDIVIDUAL' | 'CORPORATE',
          carrierType: (validated.carrierType as 'DOCOMO' | 'AU' | 'SOFTBANK' | 'RAKUTEN' | undefined) ?? null,
          plan: validated.plan ?? null,
          isMnpEligible: validated.isMnpEligible,
          isAutoCancel: validated.isAutoCancel,
          autoCancelDate: validated.autoCancelDate ? new Date(validated.autoCancelDate) : null,
          supplierContractStart: validated.supplierContractStart ? new Date(validated.supplierContractStart) : null,
          supplierContractEnd: validated.supplierContractEnd ? new Date(validated.supplierContractEnd) : null,
          eligibleTagIds: validated.eligibleTagIds ?? [],
        });
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          iccid: row.iccid || '不明',
          error: error.issues
            ? error.issues.map((e: any) => e.message).join(', ')
            : error.message || '不明なエラー',
        });
      }
    }

    return validatedRows;
  }

  /**
   * ICCID重複除去（最後の行を優先）
   */
  private deduplicateByIccid(rows: ValidatedRow[]): ValidatedRow[] {
    const deduped = new Map<string, ValidatedRow>();
    for (const row of rows) {
      deduped.set(row.iccid, row);
    }
    return Array.from(deduped.values());
  }

  /**
   * バッチUpsert実行
   */
  private async batchUpsert(rows: ValidatedRow[], result: ImportResult): Promise<void> {
    for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
      const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);

      try {
        await this.bulkUpsert(batch);
        result.success += batch.length;
      } catch (dbError) {
        // バルクupsert失敗時は個別upsertにフォールバック
        logger.warn('バルクUpsert失敗、個別処理にフォールバック', { batchSize: batch.length });
        await this.fallbackIndividualUpsert(batch, result);
      }
    }
  }

  /**
   * バルクUpsert（Raw SQL）
   */
  private async bulkUpsert(batch: ValidatedRow[]): Promise<void> {
    const { Prisma } = await import('@repo/database');

    const values = batch.map(
      (row) => Prisma.sql`(
        ${row.iccid},
        ${row.msisdn},
        ${row.supplierId},
        ${row.simType}::"SimType",
        ${row.carrierType}::"CarrierType",
        ${row.plan},
        ${row.isMnpEligible},
        ${row.isAutoCancel},
        ${row.autoCancelDate},
        ${row.supplierContractStart},
        ${row.supplierContractEnd},
        ${row.eligibleTagIds},
        NOW(),
        NOW()
      )`
    );

    await this.prisma.$executeRaw`
      INSERT INTO "Sim" (
        "iccid",
        "msisdn",
        "supplierId",
        "simType",
        "carrierType",
        "plan",
        "isMnpEligible",
        "isAutoCancel",
        "autoCancelDate",
        "supplierContractStart",
        "supplierContractEnd",
        "eligibleTagIds",
        "createdAt",
        "updatedAt"
      )
      VALUES ${Prisma.join(values)}
      ON CONFLICT ("iccid") DO UPDATE SET
        "msisdn" = EXCLUDED."msisdn",
        "supplierId" = EXCLUDED."supplierId",
        "simType" = EXCLUDED."simType",
        "carrierType" = EXCLUDED."carrierType",
        "plan" = EXCLUDED."plan",
        "isMnpEligible" = EXCLUDED."isMnpEligible",
        "isAutoCancel" = EXCLUDED."isAutoCancel",
        "autoCancelDate" = EXCLUDED."autoCancelDate",
        "supplierContractStart" = EXCLUDED."supplierContractStart",
        "supplierContractEnd" = EXCLUDED."supplierContractEnd",
        "eligibleTagIds" = EXCLUDED."eligibleTagIds",
        "updatedAt" = NOW()
    `;
  }

  /**
   * 個別Upsert（フォールバック）
   */
  private async fallbackIndividualUpsert(
    batch: ValidatedRow[],
    result: ImportResult
  ): Promise<void> {
    for (const row of batch) {
      try {
        await this.prisma.sim.upsert({
          where: { iccid: row.iccid },
          update: {
            msisdn: row.msisdn,
            supplierId: row.supplierId,
            simType: row.simType,
            carrierType: row.carrierType,
            plan: row.plan,
            isMnpEligible: row.isMnpEligible,
            isAutoCancel: row.isAutoCancel,
            autoCancelDate: row.autoCancelDate,
            supplierContractStart: row.supplierContractStart,
            supplierContractEnd: row.supplierContractEnd,
            eligibleTagIds: row.eligibleTagIds,
          },
          create: {
            iccid: row.iccid,
            msisdn: row.msisdn,
            supplierId: row.supplierId,
            simType: row.simType,
            carrierType: row.carrierType,
            plan: row.plan,
            isMnpEligible: row.isMnpEligible,
            isAutoCancel: row.isAutoCancel,
            autoCancelDate: row.autoCancelDate,
            supplierContractStart: row.supplierContractStart,
            supplierContractEnd: row.supplierContractEnd,
            eligibleTagIds: row.eligibleTagIds,
          },
        });
        result.success++;
      } catch (rowError: any) {
        result.failed++;
        result.errors.push({
          row: row.index + 1,
          iccid: row.iccid,
          error: rowError.message || 'データベースエラー',
        });
      }
    }
  }
}
