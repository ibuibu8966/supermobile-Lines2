import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { ApplicationLineStatus } from "@repo/database";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;

    // Validate and prepare update data
    const updateData: any = {};

    if (body.lineReserveTagId !== undefined) {
      updateData.lineReserveTagId = body.lineReserveTagId;
    }

    if (body.shippedAt !== undefined) {
      updateData.shippedAt = body.shippedAt ? new Date(body.shippedAt) : null;
      // Auto-update status to SHIPPED when shippedAt is set
      if (body.shippedAt && !body.status) {
        updateData.status = ApplicationLineStatus.SHIPPED;
      }
    }

    if (body.returnedAt !== undefined) {
      updateData.returnedAt = body.returnedAt ? new Date(body.returnedAt) : null;
      // Auto-update status to RETURNED when returnedAt is set
      if (body.returnedAt && !body.status) {
        updateData.status = ApplicationLineStatus.RETURNED;
      }
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.note !== undefined) {
      updateData.note = body.note;
    }

    // Update the line
    const updatedLine = await prisma.applicationLine.update({
      where: { id },
      data: updateData,
      include: {
        application: {
          include: {
            customer: {
              select: {
                lastName: true,
                firstName: true,
                companyName: true,
                type: true,
              },
            },
          },
        },
        sim: {
          select: {
            iccid: true,
            msisdn: true,
            carrierType: true,
            simLocationTag: true,
            simLocationTagId: true,
          },
        },
        lineReserveTag: true,
      },
    });

    // If SIM location tag needs to be updated, update the SIM
    if (body.simLocationTagId !== undefined && updatedLine.simId) {
      await prisma.sim.update({
        where: { iccid: updatedLine.simId },
        data: { simLocationTagId: body.simLocationTagId },
      });
    }

    return NextResponse.json(updatedLine);
  } catch (error) {
    console.error("Line update error:", error);
    return NextResponse.json(
      { error: "Failed to update line" },
      { status: 500 }
    );
  }
}
