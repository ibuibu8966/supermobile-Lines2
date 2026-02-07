import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

const scanSchema = z.object({
  iccids: z.array(z.string().regex(/^[A-Z0-9]{15}$/, "ICCIDは15桁の英数字（大文字）です")).min(1),
  contractMonth: z.coerce.date(),
  lineTagId: z.number().int().positive().optional().nullable(),
  lineReserveTagId: z.number().int().positive().optional().nullable(),
});

// ICCID一括割当
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = scanSchema.parse(body);

    // 申し込みの存在確認
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        lines: {
          where: { status: "NOT_ACTIVATED" },
          orderBy: { lineNumber: "asc" },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "申し込みが見つかりません" },
        { status: 404 }
      );
    }

    const notActivatedLines = application.lines;

    if (notActivatedLines.length === 0) {
      return NextResponse.json(
        { error: "未割当の回線がありません" },
        { status: 400 }
      );
    }

    // ICCIDの重複チェック
    const uniqueIccids = [...new Set(validated.iccids)];
    if (uniqueIccids.length !== validated.iccids.length) {
      return NextResponse.json(
        { error: "重複したICCIDがあります" },
        { status: 400 }
      );
    }

    // SIMの存在・ステータス確認（存在しないSIMも許可）
    const sims = await prisma.sim.findMany({
      where: { iccid: { in: uniqueIccids } },
    });

    const simMap = new Map(sims.map((s) => [s.iccid, s]));
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const iccid of uniqueIccids) {
      const sim = simMap.get(iccid);
      if (!sim) {
        // SIMが存在しない場合は警告のみ（エラーにしない）
        warnings.push(`ICCID ${iccid} はSIMマスタに未登録です`);
      } else if (sim.status !== "IN_STOCK") {
        // SIMが存在するが在庫状態でない場合はエラー
        errors.push(`ICCID ${iccid} は在庫状態ではありません (${sim.status})`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join("\n") },
        { status: 400 }
      );
    }

    // 割当数の確認
    if (uniqueIccids.length > notActivatedLines.length) {
      return NextResponse.json(
        { error: `未割当回線数(${notActivatedLines.length})より多くのICCIDが指定されています(${uniqueIccids.length})` },
        { status: 400 }
      );
    }

    // lineTagIdの存在確認
    if (validated.lineTagId) {
      const tag = await prisma.lineTag.findUnique({
        where: { id: validated.lineTagId },
      });
      if (!tag) {
        return NextResponse.json(
          { error: "指定された回線タグが見つかりません" },
          { status: 400 }
        );
      }
    }

    // lineReserveTagIdの存在確認
    if (validated.lineReserveTagId) {
      const tag = await prisma.lineReserveTag.findUnique({
        where: { id: validated.lineReserveTagId },
      });
      if (!tag) {
        return NextResponse.json(
          { error: "指定された回線予備タグが見つかりません" },
          { status: 400 }
        );
      }
    }

    // トランザクションで一括更新
    const results = await prisma.$transaction(async (tx) => {
      const updatedLines = [];

      for (let i = 0; i < uniqueIccids.length; i++) {
        const iccid = uniqueIccids[i];
        const line = notActivatedLines[i];
        const sim = simMap.get(iccid);

        // 回線にSIMを割当（SIMが存在する場合のみsimIdを設定）
        const updatedLine = await tx.applicationLine.update({
          where: { id: line.id },
          data: {
            simId: sim ? iccid : null,
            msisdn: sim?.msisdn || null,
            status: "ACTIVATED",
            contractMonth: validated.contractMonth,
            lineTagId: validated.lineTagId,
            lineReserveTagId: validated.lineReserveTagId,
          },
          include: {
            sim: {
              include: {
                simLocationTag: true,
              },
            },
            lineTag: true,
            lineReserveTag: true,
          },
        });

        // SIMが存在する場合のみステータスを更新
        if (sim) {
          await tx.sim.update({
            where: { iccid },
            data: { status: "ACTIVE" },
          });
        }

        updatedLines.push(updatedLine);
      }

      return updatedLines;
    });

    return NextResponse.json({
      message: `${results.length}件の回線にICCIDを割り当てました`,
      assignedCount: results.length,
      lines: results,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("ICCID一括割当エラー:", error);
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json(
      { error: "ICCID一括割当に失敗しました", details: errorMessage },
      { status: 500 }
    );
  }
}
