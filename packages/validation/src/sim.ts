import { z } from 'zod'

// ICCID検証
export const iccidSchema = z.string()
  .regex(/^[A-Z0-9]{15,20}$/, 'ICCIDは15〜20桁の英数字（大文字）です')

// 電話番号検証（固定電話・携帯電話両対応: 0始まり10〜11桁）
export const msisdnSchema = z.string()
  .regex(/^0\d{9,10}$/, '電話番号の形式が正しくありません')
  .optional()
  .nullable()

// SIMインポート行スキーマ
export const simImportRowSchema = z.object({
  iccid: iccidSchema,
  msisdn: msisdnSchema,
  supplier: z.string().min(1, '仕入れ先を入力してください'),
  simType: z.enum(['INDIVIDUAL', 'CORPORATE']).default('INDIVIDUAL'),
  carrierType: z.enum(['DOCOMO', 'AU', 'SOFTBANK', 'RAKUTEN']).optional(),
  plan: z.string().optional(),
  isMnpEligible: z.coerce.boolean().default(false),
  isAutoCancel: z.coerce.boolean().default(false),
  supplierContractStart: z.coerce.date().optional(),
  supplierContractEnd: z.coerce.date().optional(),
})

// SIM作成スキーマ
export const createSimSchema = z.object({
  iccid: iccidSchema,
  msisdn: msisdnSchema,
  supplierId: z.number().int().positive('仕入れ先を選択してください'),
  simType: z.enum(['INDIVIDUAL', 'CORPORATE']).default('INDIVIDUAL'),
  carrierType: z.enum(['DOCOMO', 'AU', 'SOFTBANK', 'RAKUTEN']).optional(),
  plan: z.string().optional(),
  isMnpEligible: z.boolean().default(false),
  isAutoCancel: z.boolean().default(false),
  supplierContractStart: z.coerce.date().optional(),
  supplierContractEnd: z.coerce.date().optional(),
})

// SIM更新スキーマ
export const updateSimSchema = z.object({
  msisdn: msisdnSchema,
  simType: z.enum(['INDIVIDUAL', 'CORPORATE']).optional(),
  carrierType: z.enum(['DOCOMO', 'AU', 'SOFTBANK', 'RAKUTEN']).optional().nullable(),
  plan: z.string().optional().nullable(),
  isMnpEligible: z.boolean().optional(),
  isAutoCancel: z.boolean().optional(),
  autoCancelDate: z.coerce.date().optional().nullable(),
  mnpReservationNumber: z.string().max(20).optional().nullable(),
  mnpExpiryDate: z.coerce.date().optional().nullable(),
  status: z.enum(['IN_STOCK', 'ACTIVE', 'RETURNING', 'RETIRED', 'CANCELLED']).optional(),
  simLocationTagId: z.number().int().positive().optional().nullable(),
})

// SIMフィルタスキーマ
export const simFilterSchema = z.object({
  status: z.array(z.enum(['IN_STOCK', 'ACTIVE', 'RETURNING', 'RETIRED', 'CANCELLED'])).optional(),
  simType: z.enum(['INDIVIDUAL', 'CORPORATE']).optional(),
  supplierId: z.coerce.number().optional(),
  carrierType: z.enum(['DOCOMO', 'AU', 'SOFTBANK', 'RAKUTEN']).optional(),
  usageTagId: z.coerce.number().optional(),
  isMnpEligible: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  sortBy: z.enum(['iccid', 'updatedAt', 'createdAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// 仕入れ先スキーマ
export const supplierSchema = z.object({
  code: z.string().min(1, 'コードを入力してください').max(50),
  name: z.string().min(1, '名前を入力してください').max(100),
  isActive: z.boolean().default(true),
})

// 用途タグスキーマ
export const usageTagSchema = z.object({
  code: z.string().min(1, 'コードを入力してください').max(50),
  name: z.string().min(1, '名前を入力してください').max(100),
  category: z.string().max(50).optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
})

// 販売ルールスキーマ
export const usageRuleSchema = z.object({
  usageTagId: z.number().int().positive('用途タグを選択してください'),
  supplierFilter: z.string().max(50).optional().nullable(),
  carrierFilter: z.enum(['DOCOMO', 'AU', 'SOFTBANK', 'RAKUTEN']).optional().nullable(),
  planFilter: z.string().max(100).optional().nullable(),
  excludedTagIds: z.array(z.number().int()).default([]),
  minContractDays: z.number().int().min(0).default(0),
  requiresMnp: z.boolean().default(false),
  conditions: z.record(z.unknown()).default({}),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export type SimImportRowInput = z.infer<typeof simImportRowSchema>
export type CreateSimInput = z.infer<typeof createSimSchema>
export type UpdateSimInput = z.infer<typeof updateSimSchema>
export type SimFilterInput = z.infer<typeof simFilterSchema>
export type SupplierInput = z.infer<typeof supplierSchema>
export type UsageTagInput = z.infer<typeof usageTagSchema>
export type UsageRuleInput = z.infer<typeof usageRuleSchema>
