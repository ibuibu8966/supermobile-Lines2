/**
 * Sim Domain Entity
 *
 * SIMカードのドメインエンティティ定義
 */

// Sim Status Enum
export enum SimStatus {
  STOCK = 'STOCK',
  ASSIGNED = 'ASSIGNED',
  ACTIVATED = 'ACTIVATED',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

// Carrier Type Enum
export enum CarrierType {
  DOCOMO = 'DOCOMO',
  AU = 'AU',
  SOFTBANK = 'SOFTBANK',
  RAKUTEN = 'RAKUTEN',
}

/**
 * 基本Sim Entity
 */
export interface SimEntity {
  iccid: string;
  msisdn: string | null;
  pin1: string | null;
  pin2: string | null;
  puk1: string | null;
  puk2: string | null;
  carrierType: CarrierType;
  status: SimStatus;
  supplierId: number | null;
  simLocationTagId: number | null;
  consumedTagIds: number[];
  eligibleTagIds?: number[];
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sim with Relations (API response用)
 */
export interface SimWithRelations extends SimEntity {
  supplier?: {
    id: number;
    name: string;
  } | null;
  simLocationTag?: {
    id: number;
    name: string;
  } | null;
  contracts?: Array<{
    id: string;
    customerId: string;
    startDate: Date;
    endDate: Date | null;
    status: string;
    createdAt: Date;
    usageTags: Array<{
      id: string;
      usageTag: {
        id: number;
        name: string;
      };
    }>;
    customer: {
      id: string;
      lastName: string | null;
      firstName: string | null;
      companyName: string | null;
      type: string;
    };
  }>;
  applicationLines?: Array<{
    id: string;
    application: {
      id: string;
      applicationNumber: string;
      isArchived: boolean;
      archivedAt: Date | null;
    };
  }>;
  consumedTags?: Array<{
    id: number;
    name: string;
  }>;
  eligibleTags?: Array<{
    id: number;
    name: string;
  }>;
}

/**
 * Sim Create Input
 */
export interface SimCreateInput {
  iccid: string;
  msisdn?: string | null;
  pin1?: string | null;
  pin2?: string | null;
  puk1?: string | null;
  puk2?: string | null;
  carrierType: CarrierType;
  status?: SimStatus;
  supplierId?: number | null;
  simLocationTagId?: number | null;
  consumedTagIds?: number[];
  note?: string | null;
}

// Sim Type Enum (from route.ts schema)
export enum SimType {
  INDIVIDUAL = 'INDIVIDUAL',
  CORPORATE = 'CORPORATE',
}

/**
 * Sim Update Input
 */
export interface SimUpdateInput {
  msisdn?: string | null;
  simType?: SimType;
  carrierType?: CarrierType | null;
  plan?: string | null;
  isMnpEligible?: boolean;
  isAutoCancel?: boolean;
  autoCancelDate?: Date | null;
  mnpReservationNumber?: string | null;
  mnpExpiryDate?: Date | null;
  status?: SimStatus | 'IN_STOCK' | 'ACTIVE' | 'RETURNING' | 'RETIRED' | 'CANCELLED';
  simLocationTagId?: number | null;
}
