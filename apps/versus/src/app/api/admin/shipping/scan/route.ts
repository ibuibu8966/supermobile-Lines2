import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

// スキャンリクエストスキーマ
const scanSchema = z.object({
  applicationLineId: z.string().min(1, "回線IDは必須です"),
  iccid: z.string().regex(/^[A-Z0-9]{15}$/, "ICCIDは15桁の英数字（大文字）です"),
  contractMonth: z.coerce.date().optional(),
  lineTagId: z.number().int().positive().optional().nullable(),
  lineReserveTagId: z.number().int().positive().optional().nullable(),
});

// SIMスキャン処理
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = scanSchema.parse(body);

    // 回線の存在確認
    const applicationLine = await prisma.applicationLine.findUnique({
      where: { id: validated.applicationLineId },
      include: {
        application: {
          include: {
            plan: {
              include: {
                usageTags: {
                  include: {
                    usageTag: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!applicationLine) {
      return NextResponse.json(
        { error: "回線が見つかりません" },
        { status: 404 }
      );
    }

    if (applicationLine.application.status !== "PAID") {
      return NextResponse.json(
        { error: "この申込は発送処理できる状態ではありません" },
        { status: 400 }
      );
    }

    if (applicationLine.simId) {
      return NextResponse.json(
        { error: "この回線には既にSIMが割り当てられています" },
        { status: 400 }
      );
    }

    // SIMの存在確認
    const sim = await prisma.sim.findUnique({
      where: { iccid: validated.iccid },
    });

    if (!sim) {
      return NextResponse.json(
        { error: "このICCIDのSIMは登録されていません" },
        { status: 404 }
      );
    }

    // SIMが在庫状態かチェック
    if (sim.status !== "IN_STOCK") {
      const statusLabels: Record<string, string> = {
        ACTIVE: "利用中",
        RETURNING: "返却中",
        RETIRED: "廃止済み",
      };
      return NextResponse.json(
        {
          error: `このSIMは${statusLabels[sim.status] || sim.status}のため割り当てできません`,
        },
        { status: 400 }
      );
    }

    // プランの用途タグに基づいてSIMの利用可能性をチェック
    const planUsageTags = applicationLine.application.plan.usageTags.map(
      (ut) => ut.usageTag.id
    );

    // SIMの消費済みタグと比較（交差があれば使用不可）
    const consumedTagIds = (sim.consumedTagIds as number[]) || [];
    const conflictingTags = planUsageTags.filter((tagId) =>
      consumedTagIds.includes(tagId)
    );

    if (conflictingTags.length > 0) {
      return NextResponse.json(
        {
          error:
            "このSIMは選択されたプランの用途では使用できません（既に同じ用途で使用済み）",
        },
        { status: 400 }
      );
    }

    // ApplicationLineにSIMを紐付け
    const updatedLine = await prisma.applicationLine.update({
      where: { id: validated.applicationLineId },
      data: {
        simId: sim.iccid,
        msisdn: sim.msisdn,
        status: "ASSIGNED",
        contractMonth: validated.contractMonth,
        lineTagId: validated.lineTagId,
        lineReserveTagId: validated.lineReserveTagId,
      },
    });

    return NextResponse.json({
      line: {
        id: updatedLine.id,
        lineNumber: updatedLine.lineNumber,
        simId: updatedLine.simId,
        msisdn: updatedLine.msisdn,
        status: updatedLine.status,
      },
      sim: {
        iccid: sim.iccid,
        msisdn: sim.msisdn,
        carrierType: sim.carrierType,
        plan: sim.plan,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("SIMスキャンエラー:", error);
    return NextResponse.json(
      { error: "SIMスキャン処理に失敗しました" },
      { status: 500 }
    );
  }
}
