/**
 * Customer dashboard service
 */

import { PrismaClient } from "@repo/database";
import { CustomerDashboardResult } from "../domain/entities/customer-dashboard.entity";
import { logger } from "../shared/utils/logger";

export class CustomerDashboardService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get customer dashboard data
   */
  async getCustomerDashboard(userId: string): Promise<CustomerDashboardResult> {
    // Fetch customer by userId
    const customer = await this.prisma.customer.findFirst({
      where: { userId },
    });

    if (!customer) {
      logger.warn("Customer not found for user", { userId });
      return {
        customer: null,
        applications: [],
        lineStats: { active: 0, pending: 0, cancelled: 0 },
      };
    }

    // Fetch applications with plan and lines
    const applications = await this.prisma.application.findMany({
      where: { customerId: customer.id },
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
        (l) => l.status === "ACTIVATED" || l.status === "SHIPPED"
      ).length,
      pending: allLines.filter(
        (l) => l.status === "NOT_ACTIVATED" || l.status === "ACTIVATED"
      ).length,
      cancelled: allLines.filter(
        (l) => l.status === "CANCELLED" || l.status === "RETURNED"
      ).length,
    };

    logger.info("Customer dashboard retrieved", { 
      userId, 
      customerId: customer.id,
      applicationCount: applications.length 
    });

    return {
      customer,
      applications,
      lineStats,
    };
  }
}
