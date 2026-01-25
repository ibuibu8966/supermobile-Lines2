# スーパー回線管理くん - 開発ガイドライン

## 重要な開発ルール

**迷ったら必ずユーザーに相談すること。勝手に決めない。**

---

## プロジェクト概要

MVNO事業で複数サービス（物販・バーサス・Avaris）を展開。同じICCIDのSIMを認証用・アドアフィ用・MNP弾用など用途を変えて再販している。返却されたSIMの過去利用履歴を追跡し、次に何として販売できるか判断できるシステムを構築する。

### 本プロジェクトの構成

1. **SIM統合管理システム（admin）** - 全サービスを横断してSIMを管理
2. **各サービスのフロントエンド（buppan/versus/avaris）** - LP、申込フォーム、顧客マイページ、管理画面

---

## 技術スタック

| 項目 | 技術 |
|------|------|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| ORM | Prisma |
| Database | Supabase (PostgreSQL) - 全サービス共通 |
| Language | TypeScript |
| Validation | Zod |
| Authentication | Auth.js (NextAuth.js) |
| File Storage | Supabase Storage（本人確認書類） |
| Build | モノレポ構成（Turborepo + pnpm） |

---

## モノレポ構成

```
supermobile-Lines/
├── apps/
│   ├── admin/          # SIM統合管理システム（管理者用）
│   ├── buppan/         # 物販サービス（LP/申込/マイページ/管理）
│   ├── versus/         # バーサスサービス（LP/申込/マイページ/管理）
│   └── avaris/         # Avarisサービス（LP/申込/マイページ/管理）
├── packages/
│   ├── database/       # Prismaスキーマ・クライアント
│   ├── ui/             # 共通UIコンポーネント（shadcn/ui）
│   ├── auth/           # Auth.js設定・プロバイダー
│   ├── validation/     # Zodスキーマ
│   └── config/         # 共通設定（ESLint, TypeScript等）
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

### 各アプリの役割

| アプリ | 用途 | 対象ユーザー | 認証 |
|--------|------|-------------|------|
| admin | SIM一元管理・同期・ルール設定・サービス/プラン管理 | 運営者 | Auth.js（管理者のみ） |
| buppan | 物販LP・申込・マイページ・管理 | 顧客・運営者 | Auth.js |
| versus | バーサスLP・申込・マイページ・管理 | 顧客・運営者 | Auth.js |
| avaris | AvarisLP・申込・マイページ・管理 | 顧客・運営者 | Auth.js |

---

## データベース設計

### SIM管理関連

#### Supplier（仕入れ先マスタ）
- `id`: 自動採番
- `code`: 仕入れ先コード
- `name`: 仕入れ先名
- `isActive`: 有効フラグ

#### Sim（SIMマスタ）
- `iccid`: プライマリキー（19-20桁）
- `msisdn`: 電話番号
- `supplierId`: 仕入れ先
- `simType`: INDIVIDUAL/CORPORATE（個人回線/法人回線）
- `carrierType`: DOCOMO/AU/SOFTBANK/RAKUTEN
- `isMnpEligible`: MNP可否
- `isAutoCancel`: 翌月自動解約フラグ
- `status`: IN_STOCK/ACTIVE/RETURNING/RETIRED/CANCELLED
- `consumedTagIds`: 消費済み用途タグID配列（GINインデックス）
- `currentContractId`: 現在の契約ID（非正規化）

#### Contract（契約履歴）
- `id`: CUID
- `iccid`: SIMへの参照
- `serviceName`: サービス名
- `customerId`: 外部顧客ID
- `contractStart/End`: 契約期間
- `status`: PENDING/SHIPPED/ACTIVE/ENDED/CANCELLED
- `shippedAt/arrivedAt/returnedAt`: 配送追跡

#### UsageTag（用途タグマスタ）
- `id`: 自動採番
- `code`: 用途コード（pokeka/adaafi/mnp等）
- `name`: 用途名（ポケカ認証/アダアフィ/MNP等）
- `category`: カテゴリ
- `isActive`: 有効フラグ

#### ContractUsageTag（契約-用途タグ中間テーブル）
- 1契約に複数の用途タグを紐付け可能
- `appliedAt`: 適用日時

#### UsageRule（販売可能判定ルール）
- `usageTagId`: 対象用途タグ
- `supplierFilter/carrierFilter/planFilter`: 条件フィルタ
- `excludedTagIds`: 排他タグ
- `minContractDays`: 最低契約日数
- `requiresMnp`: MNP必須フラグ
- `priority`: 優先度

### 顧客・申込関連

#### Service（サービスマスタ）
- `id`: CUID
- `code`: サービスコード（buppan/versus/avaris）
- `name`: 表示名
- `isActive`: 有効フラグ

#### Customer（顧客）
- `id`: CUID
- `serviceId`: サービス
- `userId`: Auth.jsユーザーID
- `type`: INDIVIDUAL（個人）/ CORPORATE（法人）
- `email`: メールアドレス
- `phone`: 電話番号
- **個人情報**
  - `lastName/firstName`: 姓・名
  - `lastNameKana/firstNameKana`: 姓カナ・名カナ
  - `birthDate`: 生年月日
  - `postalCode/prefecture/city/address/building`: 住所
- **法人情報（法人の場合のみ）**
  - `companyName/companyNameKana`: 法人名・法人名カナ
  - `establishedDate`: 設立年月
  - `companyPostalCode/companyPrefecture/companyCity/companyAddress/companyBuilding`: 法人住所
- `status`: ACTIVE/SUSPENDED/DELETED
- `note`: 顧客メモ（管理者用）

#### User（Auth.js認証）
- `id`: CUID
- `email`: メールアドレス
- `password`: ハッシュ化パスワード
- `role`: CUSTOMER/ADMIN/SUPER_ADMIN
- `serviceId`: 所属サービス（管理者の場合）
- `isActive`: 有効フラグ

#### Application（申込）
- `id`: CUID
- `applicationNumber`: 申込番号（自動採番）
- `customerId`: 顧客
- `serviceId`: サービス
- `planId`: プラン
- `lineCount`: 申込回線数
- `unitPrice`: 単価（申込時点の価格を保存）
- `totalAmount`: 合計金額
- `status`: SUBMITTED/KYC_PENDING/KYC_APPROVED/KYC_REJECTED/PAYMENT_PENDING/PAID/SHIPPING/COMPLETED/CANCELLED
- `appliedAt`: 申込日時
- `paidAt`: 入金日時
- `note`: 申込メモ（管理者用）

#### ApplicationLine（申込回線）
- `id`: CUID
- `applicationId`: 申込
- `lineNumber`: 回線番号（申込内の連番）
- `simId`: 割当SIMのICCID（発送時に紐付け）
- `msisdn`: 電話番号（SIMマスタから自動取得）
- `status`: UNASSIGNED/ASSIGNED/SHIPPED/ACTIVE/CANCELLED/RETURNED
- `shippedAt`: 発送日時
- `returnedAt`: 返却日時
- `note`: 回線メモ（管理者用）

#### KycImage（本人確認書類）
- `id`: CUID
- `applicationId`: 申込
- `type`: ID_FRONT/ID_BACK/SELFIE/ADDRESS_PROOF
- `storagePath`: Supabase Storageパス
- `status`: PENDING/APPROVED/REJECTED
- `reviewedAt`: 確認日時
- `reviewNote`: 確認メモ

#### Plan（プランマスタ）
- `id`: CUID
- `serviceId`: サービス
- `code`: プランコード
- `name`: プラン名
- `usageTagId`: 関連用途タグ（SIM割当時に使用）
- `isActive`: 有効フラグ

#### PlanPricing（プラン料金テーブル）
- `id`: CUID
- `planId`: プラン
- `customerType`: INDIVIDUAL/CORPORATE（個人/法人）
- `minQuantity`: 最低回線数
- `maxQuantity`: 最大回線数（null=上限なし）
- `unitPrice`: 単価
- `description`: 説明

---

## 業務フロー

### 申込〜発送フロー

```
1. 顧客がLP→申込フォームでプラン・情報・回線数を入力
2. 申込完了 → パスワード設定 → マイページ利用可能に
3. 管理者がKYC確認（画像と情報を目視確認）
   - OK → KYC_APPROVED
   - NG → KYC_REJECTED（システム外で連絡）
4. 請求書発行（システム外）
5. 入金確認 → 管理画面で「入金確認」ボタン → PAID
6. 発送画面で申込を選択
7. バーコードリーダーでSIMスキャン
   - ICCIDが入力される
   - SIMマスタから電話番号を自動取得
   - ApplicationLineに紐付け
8. 全回線分スキャン完了 or 一部発送
9. 発送処理 → SHIPPING → 顧客に届いたら COMPLETED
```

### 解約・返却フロー

```
1. 顧客がマイページで解約申請 or 管理者が解約処理
2. ApplicationLine.status → CANCELLED
3. SIMが返却される
4. バーコードスキャン or 手動で返却処理
5. ApplicationLine.status → RETURNED
6. Sim.status → IN_STOCK（再利用可能）
7. Contract.status → ENDED（履歴として記録）
```

---

## 権限管理

| ロール | 説明 | 権限 |
|--------|------|------|
| CUSTOMER | 顧客 | マイページのみ |
| ADMIN | 一般管理者 | 申込・顧客・回線の閲覧・編集 |
| SUPER_ADMIN | スーパー管理者 | 全機能＋ユーザー管理＋設定変更 |

---

## 画面構成

### apps/admin（SIM統合管理システム）

```
/                   # ダッシュボード
/sims               # SIM一覧（親子表示）
/sims/[iccid]       # SIM詳細
/sims/import        # CSVインポート
/suppliers          # 仕入れ先管理
/rules              # 販売ルール管理
/usage-tags         # 用途タグ管理
/services           # サービス管理
/plans              # プラン管理（料金テーブル含む）
/sync               # 外部サービス同期
/users              # ユーザー管理（SUPER_ADMINのみ）
```

### apps/buppan, versus, avaris（各サービス）

```
/(public)
  /                 # LP（ランディングページ）
  /apply            # 申込フォーム（ステップ形式）
  /login            # ログイン

/(customer)         # 要ログイン（CUSTOMER）
  /dashboard        # ダッシュボード
  /applications     # 申込履歴
  /lines            # 回線一覧
  /cancel           # 解約申請
  /settings         # 設定

/(admin)            # 要ログイン（ADMIN/SUPER_ADMIN）
  /applications     # 申込一覧・KYC確認・入金確認
  /customers        # 顧客管理
  /shipping         # 発送管理（バーコードスキャン）
  /lines            # 回線管理・解約・返却処理
```

---

## 申込フォーム（ステップ形式）

1. **Step 1: プラン選択** - サービスで提供しているプランを選ぶ
2. **Step 2: 個人/法人選択** → 情報入力（Zodバリデーション）
3. **Step 3: 回線数入力** → 概算金額表示（回線数で料金変動）
4. **Step 4: 最終確認** → 送信 → パスワード設定

---

## Zodバリデーション

### 個人顧客

```typescript
const individualCustomerSchema = z.object({
  type: z.literal('INDIVIDUAL'),
  lastName: z.string().min(1, '姓を入力してください'),
  firstName: z.string().min(1, '名を入力してください'),
  lastNameKana: z.string().regex(/^[ァ-ヶー]+$/, 'カタカナで入力してください'),
  firstNameKana: z.string().regex(/^[ァ-ヶー]+$/, 'カタカナで入力してください'),
  birthDate: z.coerce.date(), // 18歳以上チェック
  phone: z.string().regex(/^0[0-9]{9,10}$/),
  email: z.string().email(),
  postalCode: z.string().regex(/^\d{3}-?\d{4}$/),
  prefecture: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  building: z.string().optional(),
})
```

### 法人顧客

```typescript
const corporateCustomerSchema = individualCustomerSchema.extend({
  type: z.literal('CORPORATE'),
  companyName: z.string().min(1),
  companyNameKana: z.string().regex(/^[ァ-ヶー\s]+$/),
  establishedDate: z.coerce.date(),
  companyPostalCode: z.string().regex(/^\d{3}-?\d{4}$/),
  companyPrefecture: z.string().min(1),
  companyCity: z.string().min(1),
  companyAddress: z.string().min(1),
  companyBuilding: z.string().optional(),
})
```

---

## 発送管理（バーコードスキャン）

1. 発送画面で申込を選択
2. バーコードリーダーでSIMのICCIDをスキャン
3. SIMマスタから電話番号を自動取得
4. ApplicationLineに紐付け
5. 一括発送/個別発送の両方対応

---

## メモ機能

- **顧客メモ**: Customer.note
- **申込メモ**: Application.note
- **回線メモ**: ApplicationLine.note

---

## 環境変数

```env
# Database（全アプリ共通）
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxx"
SUPABASE_SERVICE_ROLE_KEY="xxx"

# Auth.js
AUTH_SECRET="ランダム文字列"
AUTH_URL="http://localhost:3000"

# Encryption
ENCRYPTION_KEY="32文字以上のランダム文字列"
```

---

## 開発コマンド

```bash
# モノレポセットアップ
pnpm install

# 全体ビルド
pnpm build

# Prismaマイグレーション
pnpm --filter database prisma migrate dev

# シード
pnpm --filter database prisma db seed

# 各アプリ起動
pnpm --filter admin dev      # localhost:3000
pnpm --filter buppan dev     # localhost:3001
pnpm --filter versus dev     # localhost:3002
pnpm --filter avaris dev     # localhost:3003
```

---

## 実装順序

### Phase 1: モノレポ基盤
1. Turborepo + pnpmセットアップ
2. packages/database - Prismaスキーマ
3. packages/ui - shadcn/ui
4. packages/validation - Zodスキーマ
5. packages/auth - Auth.js設定

### Phase 2: SIM統合管理（admin）
1. 認証（Auth.js）
2. 仕入れ先・用途タグ・ルール管理
3. SIM一覧（親子表示）・詳細・CSVインポート
4. サービス・プラン管理

### Phase 3: サービス共通機能
1. LP
2. 申込フォーム（ステップ形式）
3. 顧客マイページ
4. 管理画面（申込・KYC・発送・回線管理）

### Phase 4: 統合・連携
1. 申込→SIM割当
2. 解約→返却処理
3. 外部サービス同期
