/**
 * Customer dashboard service
 */

import { PrismaClient } from "@/lib/database";
import { CustomerDashboardResult } from "@/lib/entities";
import { logger } from "../shared/utils/logger";

export class CustomerDashboardService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get customer dashboard data
   */
  async getCustomerDashboard(userId: string): Promise<CustomerDashboardResult> {
    // Fetch customer by userId (with latest KYC images from most recent application)
    const customerWithKyc = await this.prisma.customer.findFirst({
      where: { userId },
      include: {
        applications: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            kycImages: {
              select: {
                id: true,
                type: true,
                status: true,
                expiryDate: true,
                reviewedAt: true,
                reviewNote: true,
              },
            },
          },
        },
      },
    });

    if (!customerWithKyc) {
      logger.warn("Customer not found for user", { userId });
      return {
        customer: null,
        applications: [],
        lineStats: { active: 0, pending: 0, cancelled: 0 },
      };
    }

    const kycImages = customerWithKyc.applications[0]?.kycImages ?? [];

    // Fetch applications with plan and lines
    const applications = await this.prisma.application.findMany({
      where: { customerId: customerWithKyc.id },
      include: {
        plan: true,
        lines: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate line stats
    const allLines = applications.flatMap((app) => app.lines);
    const lineStats = {
      active: allLines.filter(
        (l) => l.status === "ACTIVATED" || l.status === "SHIPPED" || l.status === "SHIPPING_INSTRUCTED"
      ).length,
      pending: allLines.filter(
        (l) => l.status === "NOT_ACTIVATED"
      ).length,
      cancelled: allLines.filter(
        (l) => l.status === "CANCELLED" || l.status === "RETURNED"
      ).length,
    };

    logger.info("Customer dashboard retrieved", {
      userId,
      customerId: customerWithKyc.id,
      applicationCount: applications.length,
    });

    return {
      customer: {
        id: customerWithKyc.id,
        type: customerWithKyc.type,
        email: customerWithKyc.email,
        phone: customerWithKyc.phone,
        lastName: customerWithKyc.lastName,
        firstName: customerWithKyc.firstName,
        lastNameKana: customerWithKyc.lastNameKana,
        firstNameKana: customerWithKyc.firstNameKana,
        birthDate: customerWithKyc.birthDate,
        postalCode: customerWithKyc.postalCode,
        prefecture: customerWithKyc.prefecture,
        city: customerWithKyc.city,
        address: customerWithKyc.address,
        building: customerWithKyc.building,
        companyName: customerWithKyc.companyName,
        companyNameKana: customerWithKyc.companyNameKana,
        establishedDate: customerWithKyc.establishedDate,
        companyPostalCode: customerWithKyc.companyPostalCode,
        companyPrefecture: customerWithKyc.companyPrefecture,
        companyCity: customerWithKyc.companyCity,
        companyAddress: customerWithKyc.companyAddress,
        companyBuilding: customerWithKyc.companyBuilding,
        kycImages,
      },
      applications,
      lineStats,
    };
  }
}
