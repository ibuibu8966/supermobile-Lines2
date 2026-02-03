import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

// 発送リクエストスキーマ
const shipSchema = z.object({
  applicationId: z.string().min(1, "申込IDは必須です"),
  lineIds: z.array(z.string()).min(1, "発送する回線を選択してください"),
});

// 発送処理
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = shipSchema.parse(body);

    // 申込の存在確認
    const application = await prisma.application.findUnique({
      where: { id: validated.applicationId },
      include: {
        customer: true,
        plan: {
          include: {
            usageTags: {
              include: {
                usageTag: true,
              },
            },
          },
        },
        service: true,
        lines: {
          where: { id: { in: validated.lineIds } },
          include: {
            sim: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "申込が見つかりません" },
        { status: 404 }
      );
    }

    if (application.status !== "PAID") {
      return NextResponse.json(
        { error: "この申込は発送処理できる状態ではありません" },
        { status: 400 }
      );
    }

    // 選択された回線がすべてSIM割当済みか確認
    const unassignedLines = application.lines.filter((line) => !line.simId);
    if (unassignedLines.length > 0) {
      return NextResponse.json(
        {
          error: `${unassignedLines.length}件の回線にSIMが割り当てられていません`,
        },
        { status: 400 }
      );
    }

    // プランの用途タグを取得
    const usageTagIds = application.plan.usageTags.map((ut) => ut.usageTag.id);

    // トランザクションで発送処理を実行
    const result = await prisma.$transaction(async (tx) => {
      const contracts = [];
      const now = new Date();

      for (const line of application.lines) {
        if (!line.sim) continue;

        // 1. Contract作成
        const contract = await tx.contract.create({
          data: {
            iccid: line.sim.iccid,
            serviceName: application.service.name,
            customerId: application.customer.id,
            contractStart: now,
            status: "SHIPPED",
            shippedAt: now,
          },
        });

        // 2. ContractUsageTag作成（用途タグを紐付け）
        for (const tagId of usageTagIds) {
          await tx.contractUsageTag.create({
            data: {
              contractId: contract.id,
              usageTagId: tagId,
              appliedAt: now,
            },
          });
        }

        // 3. ApplicationLine更新
        await tx.applicationLine.update({
          where: { id: line.id },
          data: {
            contractId: contract.id,
            status: "SHIPPED",
            shippedAt: now,
          },
        });

        // 4. SIM更新
        const currentConsumedTagIds =
          (line.sim.consumedTagIds as number[]) || [];
        const newConsumedTagIds = [
          ...new Set([...currentConsumedTagIds, ...usageTagIds]),
        ];

        await tx.sim.update({
          where: { iccid: line.sim.iccid },
          data: {
            status: "ACTIVE",
            currentContractId: contract.id,
            consumedTagIds: newConsumedTagIds,
          },
        });

        contracts.push(contract);
      }

      // 5. Application更新
      // 全回線発送済みならSHIPPING、一部ならそのまま
      const allLines = await tx.applicationLine.findMany({
        where: { applicationId: application.id },
      });
      const allShipped = allLines.every((l) => l.status === "SHIPPED" || l.status === "ACTIVATED");

      const updatedApplication = await tx.application.update({
        where: { id: application.id },
        data: {
          status: allShipped ? "SHIPPING" : "PAID",
        },
      });

      return {
        application: updatedApplication,
        contracts,
        shippedLineCount: application.lines.length,
      };
    });

    return NextResponse.json({
      success: true,
      applicationStatus: result.application.status,
      shippedLineCount: result.shippedLineCount,
      contractCount: result.contracts.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("発送処理エラー:", error);
    return NextResponse.json(
      { error: "発送処理に失敗しました" },
      { status: 500 }
    );
  }
}
