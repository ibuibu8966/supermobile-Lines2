import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@repo/database";
import { simImportRowSchema } from "@repo/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";

interface ImportRow {
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

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; iccid: string; error: string }>;
}

interface ValidatedRow {
  index: number;
  iccid: string;
  msisdn: string | null;
  supplierId: number;
  simType: "INDIVIDUAL" | "CORPORATE";
  carrierType: "DOCOMO" | "AU" | "SOFTBANK" | "RAKUTEN" | null;
  plan: string | null;
  isMnpEligible: boolean;
  isAutoCancel: boolean;
  autoCancelDate: Date | null;
  supplierContractStart: Date | null;
  supplierContractEnd: Date | null;
  eligibleTagIds: number[];
}

const BATCH_SIZE = 500;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows: ImportRow[] = body.data;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "インポートデータが空です" },
        { status: 400 }
      );
    }

    // 仕入れ先コードからIDへのマッピングを取得
    const supplierCodes = [...new Set(rows.map((r) => r.supplier))];
    const suppliers = await prisma.supplier.findMany({
      where: { code: { in: supplierCodes } },
    });
    const supplierMap = new Map<string, number>();
    for (const s of suppliers) {
      supplierMap.set(s.code, s.id);
    }

    // 存在しない仕入れ先を作成
    const missingSuplierCodes = supplierCodes.filter(
      (code) => !supplierMap.has(code)
    );
    if (missingSuplierCodes.length > 0) {
      const newSuppliers = await Promise.all(
        missingSuplierCodes.map((code) =>
          prisma.supplier.create({
            data: { code, name: code },
          })
        )
      );
      for (const s of newSuppliers) {
        supplierMap.set(s.code, s.id);
      }
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Phase 1: 全行バリデーション（DB呼び出しなし）
    const validatedRows: ValidatedRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const validated = simImportRowSchema.parse({
          ...row,
          isMnpEligible: row.isMnpEligible === true || row.isMnpEligible === "true" || row.isMnpEligible === "1",
          isAutoCancel: row.isAutoCancel === true || row.isAutoCancel === "true" || row.isAutoCancel === "1",
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
          simType: validated.simType as "INDIVIDUAL" | "CORPORATE",
          carrierType: (validated.carrierType as "DOCOMO" | "AU" | "SOFTBANK" | "RAKUTEN" | undefined) ?? null,
          plan: validated.plan ?? null,
          isMnpEligible: validated.isMnpEligible,
          isAutoCancel: validated.isAutoCancel,
          autoCancelDate: validated.autoCancelDate ? new Date(validated.autoCancelDate) : null,
          supplierContractStart: validated.supplierContractStart ? new Date(validated.supplierContractStart) : null,
          supplierContractEnd: validated.supplierContractEnd ? new Date(validated.supplierContractEnd) : null,
          eligibleTagIds: validated.eligibleTagIds ?? [],
        });
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          iccid: row.iccid || "不明",
          error: error instanceof z.ZodError
            ? error.issues.map((e) => e.message).join(", ")
            : error instanceof Error
            ? error.message
            : "不明なエラー",
        });
      }
    }

    if (validatedRows.length === 0) {
      return NextResponse.json(result);
    }

    // ICCID重複除去（最後の行を優先、現行の逐次処理と同じ挙動）
    const deduped = new Map<string, ValidatedRow>();
    for (const row of validatedRows) {
      deduped.set(row.iccid, row);
    }
    const uniqueRows = Array.from(deduped.values());

    // Phase 2: Raw SQLで一括Upsert
    for (let batchStart = 0; batchStart < uniqueRows.length; batchStart += BATCH_SIZE) {
      const batch = uniqueRows.slice(batchStart, batchStart + BATCH_SIZE);

      try {
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

        await prisma.$executeRaw`
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

        result.success += batch.length;
      } catch (dbError) {
        // バルクupsert失敗時は個別upsertにフォールバック
        for (const row of batch) {
          try {
            await prisma.sim.upsert({
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
          } catch (rowError) {
            result.failed++;
            result.errors.push({
              row: row.index + 1,
              iccid: row.iccid,
              error: rowError instanceof Error ? rowError.message : "データベースエラー",
            });
          }
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("CSVインポートエラー:", error);
    return NextResponse.json(
      { error: "CSVインポートに失敗しました" },
      { status: 500 }
    );
  }
}
