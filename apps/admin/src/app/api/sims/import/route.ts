import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
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
  supplierContractStart?: string;
  supplierContractEnd?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; iccid: string; error: string }>;
}

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

    // 1行ずつ処理
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // バリデーション
        const validated = simImportRowSchema.parse({
          ...row,
          isMnpEligible: row.isMnpEligible === true || row.isMnpEligible === "true" || row.isMnpEligible === "1",
          isAutoCancel: row.isAutoCancel === true || row.isAutoCancel === "true" || row.isAutoCancel === "1",
        });

        const supplierId = supplierMap.get(validated.supplier);
        if (!supplierId) {
          throw new Error(`仕入れ先「${validated.supplier}」が見つかりません`);
        }

        // upsert（存在すれば更新、なければ作成）
        await prisma.sim.upsert({
          where: { iccid: validated.iccid },
          update: {
            msisdn: validated.msisdn,
            supplierId,
            simType: validated.simType as "INDIVIDUAL" | "CORPORATE",
            carrierType: validated.carrierType as "DOCOMO" | "AU" | "SOFTBANK" | "RAKUTEN" | undefined,
            plan: validated.plan,
            isMnpEligible: validated.isMnpEligible,
            isAutoCancel: validated.isAutoCancel,
            supplierContractStart: validated.supplierContractStart,
            supplierContractEnd: validated.supplierContractEnd,
          },
          create: {
            iccid: validated.iccid,
            msisdn: validated.msisdn,
            supplierId,
            simType: validated.simType as "INDIVIDUAL" | "CORPORATE",
            carrierType: validated.carrierType as "DOCOMO" | "AU" | "SOFTBANK" | "RAKUTEN" | undefined,
            plan: validated.plan,
            isMnpEligible: validated.isMnpEligible,
            isAutoCancel: validated.isAutoCancel,
            supplierContractStart: validated.supplierContractStart,
            supplierContractEnd: validated.supplierContractEnd,
          },
        });

        result.success++;
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

    return NextResponse.json(result);
  } catch (error) {
    console.error("CSVインポートエラー:", error);
    return NextResponse.json(
      { error: "CSVインポートに失敗しました" },
      { status: 500 }
    );
  }
}
