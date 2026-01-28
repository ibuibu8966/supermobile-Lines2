import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { ApplicationLineStatus } from "@repo/database";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { lineIds, ...updateFields } = body;

    if (!lineIds || !Array.isArray(lineIds) || lineIds.length === 0) {
      return NextResponse.json(
        { error: "lineIds array is required" },
        { status: 400 }
      );
    }

    // Validate and prepare update data
    const updateData: any = {};

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
    console.error("Bulk line update error:", error);
    return NextResponse.json(
      { error: "Failed to update lines" },
      { status: 500 }
    );
  }
}
