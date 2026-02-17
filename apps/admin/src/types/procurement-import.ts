export type FieldMapping =
  | "iccid"
  | "msisdn"
  | "simType"
  | "carrierType"
  | "plan"
  | "supplierContractEnd"
  | "usageTag"
  | "none";

export interface ColumnMapping {
  [columnName: string]: FieldMapping;
}

export interface MappedSimData {
  iccid: string;
  msisdn?: string;
  simType?: "INDIVIDUAL" | "CORPORATE" | "BOTH";
  carrierType?: "DOCOMO" | "AU" | "SOFTBANK" | "RAKUTEN";
  plan?: string;
  supplierContractEnd?: string; // ISO date string
  isAutoCancel?: boolean;
  autoCancelDate?: string; // ISO date string
  eligibleTagIds?: number[];
}

export interface ImportValidation {
  row: number;
  iccid: string;
  errors: string[];
  warnings: string[];
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  validations: ImportValidation[];
}

export interface ManualSettings {
  simType?: "INDIVIDUAL" | "CORPORATE" | "BOTH";
  carrierType?: "DOCOMO" | "AU" | "SOFTBANK" | "RAKUTEN";
  plan?: string;
  supplierContractEnd?: string; // ISO date string
  isAutoCancel?: boolean;
  eligibleTagIds?: number[];
}
