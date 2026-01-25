import { z } from 'zod'

// 個人情報スキーマ
const individualInfoSchema = z.object({
  lastName: z.string().min(1, '姓を入力してください').max(50),
  firstName: z.string().min(1, '名を入力してください').max(50),
  lastNameKana: z.string().regex(/^[ァ-ヶー]+$/, 'カタカナで入力してください'),
  firstNameKana: z.string().regex(/^[ァ-ヶー]+$/, 'カタカナで入力してください'),
  birthDate: z.coerce.date().refine(
    (date) => {
      const today = new Date()
      const age = today.getFullYear() - date.getFullYear()
      const monthDiff = today.getMonth() - date.getMonth()
      const dayDiff = today.getDate() - date.getDate()
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age
      return actualAge >= 18
    },
    '18歳以上である必要があります'
  ),
  phone: z.string().regex(/^0[0-9]{9,10}$/, '電話番号の形式が正しくありません'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  postalCode: z.string().regex(/^\d{3}-?\d{4}$/, '郵便番号の形式が正しくありません'),
  prefecture: z.string().min(1, '都道府県を選択してください'),
  city: z.string().min(1, '市区町村を入力してください'),
  address: z.string().min(1, '番地を入力してください'),
  building: z.string().optional(),
})

// 法人情報スキーマ
const corporateInfoSchema = individualInfoSchema.extend({
  companyName: z.string().min(1, '法人名を入力してください').max(100),
  companyNameKana: z.string().regex(/^[ァ-ヶー\s]+$/, 'カタカナで入力してください'),
  establishedDate: z.coerce.date(),
  companyPostalCode: z.string().regex(/^\d{3}-?\d{4}$/, '郵便番号の形式が正しくありません'),
  companyPrefecture: z.string().min(1, '都道府県を選択してください'),
  companyCity: z.string().min(1, '市区町村を入力してください'),
  companyAddress: z.string().min(1, '番地を入力してください'),
  companyBuilding: z.string().optional(),
})

// 個人顧客スキーマ
export const individualCustomerSchema = z.object({
  type: z.literal('INDIVIDUAL'),
  ...individualInfoSchema.shape,
})

// 法人顧客スキーマ
export const corporateCustomerSchema = z.object({
  type: z.literal('CORPORATE'),
  ...corporateInfoSchema.shape,
})

// 統合顧客スキーマ（discriminated union）
export const customerSchema = z.discriminatedUnion('type', [
  individualCustomerSchema,
  corporateCustomerSchema,
])

// 顧客更新スキーマ（部分更新用）
export const updateCustomerSchema = z.object({
  phone: z.string().regex(/^0[0-9]{9,10}$/, '電話番号の形式が正しくありません').optional(),
  email: z.string().email('有効なメールアドレスを入力してください').optional(),
  postalCode: z.string().regex(/^\d{3}-?\d{4}$/, '郵便番号の形式が正しくありません').optional(),
  prefecture: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  building: z.string().optional(),
  note: z.string().optional(),
})

export type CustomerInput = z.infer<typeof customerSchema>
export type IndividualCustomerInput = z.infer<typeof individualCustomerSchema>
export type CorporateCustomerInput = z.infer<typeof corporateCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
