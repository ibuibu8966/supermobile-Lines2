import { z } from 'zod'
import { customerSchema } from './customer'

// 申込作成スキーマ
export const createApplicationSchema = z.object({
  customer: customerSchema,
  planId: z.string().cuid('プランIDが不正です'),
  lineCount: z.number().min(1, '1回線以上を入力してください').max(1000, '1000回線以下で入力してください'),
  agreeTerms: z.boolean().refine((v) => v === true, '利用規約に同意してください'),
  agreePrivacy: z.boolean().refine((v) => v === true, 'プライバシーポリシーに同意してください'),
})

// 申込ステップ1: プラン選択
export const applicationStep1Schema = z.object({
  planId: z.string().cuid('プランを選択してください'),
})

// 申込ステップ2: 顧客情報
export const applicationStep2Schema = customerSchema

// 申込ステップ3: 回線数
export const applicationStep3Schema = z.object({
  lineCount: z.number().min(1, '1回線以上を入力してください').max(1000, '1000回線以下で入力してください'),
})

// 申込ステップ4: 確認・同意
export const applicationStep4Schema = z.object({
  agreeTerms: z.boolean().refine((v) => v === true, '利用規約に同意してください'),
  agreePrivacy: z.boolean().refine((v) => v === true, 'プライバシーポリシーに同意してください'),
})

// KYC画像スキーマ
export const kycImageSchema = z.object({
  type: z.enum(['ID_FRONT', 'ID_BACK', 'SELFIE', 'ADDRESS_PROOF']),
  file: z.instanceof(File)
    .refine((f) => f.size <= 10 * 1024 * 1024, 'ファイルサイズは10MB以下にしてください')
    .refine(
      (f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type),
      'JPEG、PNG、WebP形式のみアップロード可能です'
    ),
})

// 申込ステータス更新スキーマ
export const updateApplicationStatusSchema = z.object({
  status: z.enum([
    'SUBMITTED',
    'KYC_PENDING',
    'KYC_APPROVED',
    'KYC_REJECTED',
    'PAYMENT_PENDING',
    'PAID',
    'SHIPPING',
    'COMPLETED',
    'CANCELLED',
  ]),
  note: z.string().optional(),
})

// 申込メモ更新スキーマ
export const updateApplicationNoteSchema = z.object({
  note: z.string(),
})

// パスワード設定スキーマ
export const setPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(/[a-z]/, '小文字を含めてください')
    .regex(/[A-Z]/, '大文字を含めてください')
    .regex(/[0-9]/, '数字を含めてください'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
})

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type ApplicationStep1Input = z.infer<typeof applicationStep1Schema>
export type ApplicationStep2Input = z.infer<typeof applicationStep2Schema>
export type ApplicationStep3Input = z.infer<typeof applicationStep3Schema>
export type ApplicationStep4Input = z.infer<typeof applicationStep4Schema>
export type KycImageInput = z.infer<typeof kycImageSchema>
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>
export type SetPasswordInput = z.infer<typeof setPasswordSchema>
