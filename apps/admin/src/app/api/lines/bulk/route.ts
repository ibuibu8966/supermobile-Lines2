import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { ApplicationLineStatus } from "@repo/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bulkUpdateSchema = z.object({
  lineIds: z.array(z.string()).min(1).max(1000),
  lineReserveTagId: z.number().int().optional().nullable(),
  shippedAt: z.string().optional().nullable(),
  returnedAt: z.string().optional().nullable(),
  status: z.enum(["NOT_ACTIVATED", "ACTIVATED", "SHIPPED", "RETURNED", "CANCELLED"]).optional(),
  simLocationTagId: z.number().int().optional().nullable(),
});

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { lineIds, ...updateFields } = bulkUpdateSchema.parse(body);

    // Validate and prepare update data
    const updateData: Record<string, unknown> = {};

    if (updateFields.lineReserveTagId !== undefined) {
      updateData.lineReserveTagId = updateFields.lineReserveTagId;
    }

    if (updateFields.shippedAt !== undefined) {
      updateData.shippedAt = updateFields.shippedAt ? new Date(updateFields.shippedAt) : null;
      // Auto-update status to SHIPPED when shippedAt is set
      if (updateFields.shippedAt && !updateFields.status) {
        updateData.status = ApplicationLineStatus.SHIPPED;
      }
    }

    if (updateFields.returnedAt !== undefined) {
      updateData.returnedAt = updateFields.returnedAt ? new Date(updateFields.returnedAt) : null;
      // Auto-update status to RETURNED when returnedAt is set
      if (updateFields.returnedAt && !updateFields.status) {
        updateData.status = ApplicationLineStatus.RETURNED;
      }
    }

    if (updateFields.status !== undefined) {
      updateData.status = updateFields.status;
    }

    // Update all selected lines
    const updated = await prisma.applicationLine.updateMany({
      where: { id: { in: lineIds } },
      data: updateData,
    });

    // If SIM location tag needs to be updated, update all related SIMs
    if (updateFields.simLocationTagId !== undefined) {
      // Get all lines with simId
      const lines = await prisma.applicationLine.findMany({
        where: { id: { in: lineIds }, simId: { not: null } },
        select: { simId: true },
      });

      const simIds = lines
        .map((line) => line.simId)
        .filter((simId): simId is string => simId !== null);

      if (simIds.length > 0) {
        await prisma.sim.updateMany({
          where: { iccid: { in: simIds } },
          data: { simLocationTagId: updateFields.simLocationTagId },
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: updated.count,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Bulk line update error:", error);
    return NextResponse.json(
      { error: "Failed to update lines" },
      { status: 500 }
    );
  }
}
