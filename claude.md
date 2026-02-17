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
| admin | SIM一元管理・ルール設定・サービス/プラン管理 | 運営者 | Auth.js（管理者のみ） |
| buppan | 物販LP・申込・マイページ・管理 | 顧客・運営者 | Auth.js |
| versus | バーサスLP・申込・マイページ・管理 | 顧客・運営者 | Auth.js |
| avaris | AvarisLP・申込・マイページ・管理 | 顧客・運営者 | Auth.js |

### 各アプリ内のディレクトリ構造（SayaTrade Pattern）

**参考実装**: [SayaTrade-master](https://github.com/yourusername/SayaTrade-master)

全アプリで統一された構造を採用（Clean Architecture + DDD）:

```
apps/[app-name]/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # APIルート（薄いレイヤー、10行程度）
│   │   ├── (auth)/               # 認証必須ページ
│   │   ├── (public)/             # 公開ページ
│   │   └── components/           # ページ固有のUIコンポーネント
│   │
│   ├── controllers/              # APIコントローラー層
│   │   ├── [resource].controller.ts
│   │   └── types/
│   │
│   ├── services/                 # ビジネスロジック層
│   │   └── [resource].service.ts
│   │
│   ├── repositories/             # データアクセス層
│   │   └── [resource].repository.ts
│   │
│   ├── domain/                   # ドメインモデル
│   │   ├── entities/             # エンティティ定義
│   │   ├── interfaces/           # Repository/Service interfaces
│   │   └── value-objects/        # 値オブジェクト
│   │
│   ├── infrastructure/           # インフラ層
│   │   ├── database/             # Prismaクライアントwrapper
│   │   └── external/             # 外部API
│   │
│   ├── shared/                   # アプリ内共通機能
│   │   ├── errors/               # エラーハンドリング
│   │   ├── utils/                # ユーティリティ関数
│   │   ├── validators/           # バリデーション
│   │   └── middleware/           # ミドルウェア
│   │
│   ├── components/               # 共通UIコンポーネント
│   ├── hooks/                    # カスタムフック
│   ├── contexts/                 # React Context
│   ├── lib/                      # その他ライブラリ
│   └── types/                    # 型定義
│
└── package.json
```

**重要**: この構造により
- APIルートの肥大化を防止（常に10行程度）
- 責任の明確な分離（Controller → Service → Repository）
- テスタビリティの向上
- コードの再利用性向上

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
- `plan`: 仕入れ先でのプラン名
- `isMnpEligible`: MNP可否
- `isAutoCancel`: 翌月自動解約フラグ
- `status`: IN_STOCK/ACTIVE/RETURNING/RETIRED/CANCELLED
- `consumedTagIds`: 消費済み用途タグID配列（GINインデックス）
- `currentContractId`: 現在の契約ID（非正規化）

#### Contract（契約履歴）
- `id`: CUID
- `iccid`: SIMへの参照
- `serviceName`: サービス名
- `customerId`: Customerへのリレーション（任意）
- `contractStart/End`: 契約期間
- `status`: PENDING/SHIPPED/ACTIVE/ENDED/CANCELLED
- `shippedAt/arrivedAt/returnedAt`: 配送追跡
- `applicationLines`: 紐付いたApplicationLine一覧

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
- `userId`: Auth.jsユーザーID
- `type`: INDIVIDUAL（個人）/ CORPORATE（法人）
- `email`: メールアドレス（ユニーク制約あり）
- `phone`: 電話番号（固定電話・携帯電話両対応）
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
- `contracts`: 紐付いたContract一覧

**補足**: 1顧客が複数サービス（物販・バーサス・Avaris）を利用可能。同じメールアドレスで複数サービス申込時は同一顧客として管理。

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
- `paidAt`: 入金日時
- `createdAt`: 申込日時（appliedAtは削除、createdAtで代用）
- `note`: 申込メモ（管理者用）

#### ApplicationLine（申込回線）
- `id`: CUID
- `applicationId`: 申込
- `lineNumber`: 回線番号（申込内の連番）
- `simId`: 割当SIMのICCID（発送時に紐付け）
- `contractId`: 紐付いたContract（発送時に自動作成）
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
- `usageTags`: 関連用途タグ（PlanUsageTag中間テーブル経由、複数指定可能）
- `isActive`: 有効フラグ

#### PlanUsageTag（プラン-用途タグ中間テーブル）
- `id`: CUID
- `planId`: プラン
- `usageTagId`: 用途タグ
- 1プランに複数の用途タグを紐付け可能

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
8. 発送処理実行時:
   - ApplicationLine.status → SHIPPED
   - ApplicationLine.simId → スキャンしたICCID
   - Contract自動作成（iccid, serviceName, customerId, 用途タグ）
   - ApplicationLine.contractId → 作成したContractのID
   - Sim.status → ACTIVE
   - Sim.currentContractId → 作成したContractのID
9. 顧客に届いたら COMPLETED
```

### 解約・返却フロー

**パターン1: 返却して再販する場合**
```
1. 顧客がマイページで解約申請 or 管理者が解約処理
2. ApplicationLine.status → CANCELLED
3. SIMが返却される
4. バーコードスキャン or 手動で返却処理
5. ApplicationLine.status → RETURNED
6. Contract.status → ENDED（履歴として記録）
7. Sim.status → IN_STOCK（再販可能）
```

**パターン2: 完全解約（再販不可）**
```
1. 顧客がマイページで解約申請 or 管理者が解約処理
2. ApplicationLine.status → CANCELLED
3. SIMが返却される
4. 返却処理
5. ApplicationLine.status → RETURNED
6. Contract.status → CANCELLED
7. Sim.status → RETIRED（廃棄・契約終了）
```

---

## 権限管理

| ロール | 説明 | 権限 |
|--------|------|------|
| CUSTOMER | 顧客 | マイページのみ |
| ADMIN | 一般管理者 | 担当サービスの申込・顧客・回線の閲覧・編集（User.serviceIdで制限） |
| SUPER_ADMIN | スーパー管理者 | 全サービスの全機能＋ユーザー管理＋設定変更 |

**補足**: ADMINは`User.serviceId`で紐付けられた特定サービスのみ管理可能。SUPER_ADMINは全サービスを横断して管理可能。

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

---

## パフォーマンス最適化ガイドライン

**目的**: 全ページで統一されたパフォーマンス最適化を実施し、ユーザー体験を向上させる。

### 最適化の背景

初期実装では以下の問題がありました:
- サーバー起動: 6秒以上
- ダッシュボードAPI: 900ms超
- 不要なWebpack transpileによるオーバーヘッド
- 直列クエリ実行による遅延
- 重複リクエストによるネットワーク負荷

### 最適化手順（5ステップ）

#### Step 1: transpilePackages最適化（全アプリ共通・最優先）

**問題**: `@repo/shared`をWebpackでtranspileしていた
- サーバー側コードなのにクライアント向けにトランスパイル
- 不要な処理で6秒以上の起動時間

**解決策**: 全アプリの`next.config.js`から`@repo/shared`を削除

```javascript
// BEFORE
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/auth", "@repo/validation", "@repo/shared"],
  // ...
};

// AFTER
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/auth", "@repo/validation"],
  // @repo/sharedを削除（サーバー側コードは不要）
  // ...
};
```

**効果**:
- サーバー起動時間: 6秒 → 1.5秒 (75%改善)
- 全アプリに適用済み

**実施コマンド**:
```bash
# Webpackキャッシュをクリア
rm -rf apps/*/. next

# サーバー再起動
pnpm dev
```

---

#### Step 2: APIクエリ最適化（ページごと）

**問題**: 不要なクエリや直列実行による遅延

**解決策**:
1. **不要なクエリを削除**
2. **複数クエリをPromise.allで並列実行**

```typescript
// BEFORE: 直列実行（遅い）
const overview = await prisma.$queryRaw`...`;
const tags = await prisma.usageTag.findMany(...);
const plans = await prisma.$queryRaw`...`;
// 合計時間 = query1 + query2 + query3

// AFTER: 並列実行（速い）
const [overview, tags, plans] = await Promise.all([
  prisma.$queryRaw`...`,
  prisma.usageTag.findMany(...),
  prisma.$queryRaw`...`,
]);
// 合計時間 = max(query1, query2, query3)
```

**効果**:
- ダッシュボードAPI: 900ms → 200-400ms (最大75%改善)

**チェックポイント**:
- サーバーログで`prisma:query`を確認
- 直列実行されているクエリを特定
- 依存関係のないクエリは並列化

---

#### Step 3: データベースINDEX追加（必要に応じて）

**問題**: JOIN + WHERE + GROUP BYが遅い

**解決策**: 複合INDEXで最適化

```prisma
model ApplicationLine {
  // ... 既存のフィールド

  // 複合INDEX: WHERE status = 'X' + JOIN applicationId
  @@index([status, applicationId])
  @@index([applicationId])
  @@index([status])
  // ...
}
```

**実施コマンド**:
```bash
cd packages/database
pnpm prisma db push
```

**効果**:
- クエリ実行速度: 最大75%改善
- データ量が増えても高速

**チェックポイント**:
- `EXPLAIN ANALYZE`でクエリプランを確認
- Sequential Scanが多い場合はINDEX追加を検討
- WHERE句とJOIN条件に使われるカラムの組み合わせ

---

#### Step 4: React Queryキャッシュ設定

**問題**: 同じデータを何度も取得（重複リクエスト）

**解決策**: `staleTime`を設定してキャッシュ

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: api.getDashboardStats,
  staleTime: 30000, // 30秒間キャッシュ（重複リクエスト防止）
});
```

**効果**:
- ページ遷移時の重複リクエスト削減
- ネットワーク負荷低減

**推奨値**:
- リアルタイム性が必要: `staleTime: 5000` (5秒)
- 通常のデータ: `staleTime: 30000` (30秒)
- 静的データ: `staleTime: Infinity`

---

#### Step 5: UIの簡素化（必要に応じて）

**問題**: 1ページに多すぎるデータを表示

**解決策**:
1. 必要最小限のデータのみ表示
2. 詳細データは別ページへ分離
3. 遅延ローディング（Suspense）

```typescript
// 概要のみ表示
<Dashboard>
  <OverviewCards data={overview} />
  <Link to="/details">詳細を見る</Link>
</Dashboard>

// 詳細は別ページ
<DetailsPage>
  <DetailedCharts data={detailed} />
</DetailsPage>
```

**効果**:
- 初期表示速度の向上
- ユーザー体験の向上

---

### 実績データ（ダッシュボード最適化）

| 項目 | 変更前 | 変更後 | 改善率 |
|------|--------|--------|--------|
| サーバー起動 | 6秒以上 | 1.5秒 | 75% |
| ダッシュボードAPI | 905ms | 200-400ms | 最大75% |
| リクエスト数 | 27 | 25 | 7% |
| データ転送 | 4.5MB | 4.5MB | 変更なし |

**Git Commits**:
- `94d105c`: transpilePackages最適化
- `00fe50b`: ダッシュボードクエリ最適化
- `9cd2fac`: 詳細セクション復元（並列クエリ）
- `38e0dcb`: 複合INDEX追加

---

### 全ページ適用チェックリスト

以下のページで同様の最適化を実施:

#### apps/admin
- [x] `/` - ダッシュボード（完了）
- [ ] `/applications` - 申込一覧
- [ ] `/sims` - SIM一覧
- [ ] `/lines` - 回線管理
- [ ] `/shipping` - 発送管理
- [ ] `/users` - ユーザー管理
- [ ] その他の一覧ページ

#### apps/buppan, versus, avaris
- [ ] 顧客ダッシュボード
- [ ] 申込一覧
- [ ] 回線一覧
- [ ] 管理画面各ページ

**実施手順**:
1. ページを開く
2. Chrome DevTools → Network タブで計測
3. サーバーログで`prisma:query`を確認
4. 上記5ステップを適用
5. 再計測して改善を確認
6. Git commit

---

### トラブルシューティング

#### キャッシュクリアが必要な場合
```bash
# Next.jsキャッシュ
rm -rf apps/*/. next

# node_modules再インストール
rm -rf node_modules
pnpm install

# Prisma Client再生成
cd packages/database
pnpm prisma generate
```

#### マイグレーションエラー
```bash
# スキーマをDBに反映（開発環境）
pnpm prisma db push

# 本番環境ではマイグレーションを使用
pnpm prisma migrate deploy
```

#### クエリパフォーマンス確認
```sql
-- PostgreSQLで実行
EXPLAIN ANALYZE SELECT ... ;
```

---

### 参考資料

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)
- [React Query](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)

---

## 作業履歴

### 2026-02-17: procurement UIフリッカー問題の解決

**問題**: 発注管理画面でステータスや金額を変更したとき、一瞬古いデータが表示されてから新しいデータに変わる現象（UIフリッカー）が発生していた。

**原因**: `use-procurement.ts`の`refetchOnWindowFocus: true`設定

React Queryの動作フロー:
1. ユーザーが金額/ステータスを変更
2. `onMutate`で楽観的更新 → キャッシュが"stale"マーク
3. PATCH API成功
4. `onSuccess`でキャッシュ更新 → またキャッシュが"stale"マーク
5. **React再レンダリング時、`refetchOnWindowFocus`が"stale"検知 → 即座に再フェッチ**
6. 再フェッチ中(60ms)、Reactが古いキャッシュで一瞬レンダリング
7. 結果: 新データ → 旧データ → 新データ (フリッカー!)

サーバーログでの証拠:
```
17:11:55.192 - PATCH /api/procurement/xxx 200 in 2447ms  ← 更新成功
17:11:55.253 - GET /api/procurement 200 in 60ms          ← 61ms後に自動再フェッチ!
```

**解決策**: [use-procurement.ts:12-18](apps/admin/src/hooks/use-procurement.ts#L12-L18)

```typescript
const { data: orders, isLoading, error } = useQuery<PurchaseOrder[]>({
  queryKey: ["procurement"],
  queryFn: () => fetch("/api/procurement").then((r) => r.json()),
  staleTime: 5 * 60 * 1000, // 5分間はキャッシュをfreshに保つ（楽観的更新後の不要な再フェッチを防止）
  refetchInterval: 60000, // 60秒ごとに自動再フェッチ（他ユーザーの更新を取得）
  refetchOnWindowFocus: false, // 楽観的更新後の即座な再フェッチを防止（UIフリッカー対策）
});
```

**効果**:
- `staleTime: 5分` → キャッシュがfreshのまま維持
- `refetchOnWindowFocus: false` → 再レンダリング時の自動再フェッチを無効化
- `refetchInterval: 60秒` → 定期ポーリングは継続(他ユーザーの更新検知)

**関連ファイル**:
- [apps/admin/src/hooks/use-procurement.ts](apps/admin/src/hooks/use-procurement.ts)
- [apps/admin/src/app/(auth)/procurement/page.tsx](apps/admin/src/app/(auth)/procurement/page.tsx)

---

## コードアーキテクチャガイドライン

**目的**: コードの肥大化を防ぎ、保守性・拡張性・テスタビリティを維持する。

### 基本原則

#### 1. SOLID原則の遵守

- **S**ingle Responsibility (単一責任): 1ファイル = 1つの明確な責任
- **O**pen/Closed (開放/閉鎖): 拡張に開いて、修正に閉じている
- **L**iskov Substitution (リスコフの置換): インターフェースの一貫性
- **I**nterface Segregation (インターフェース分離): 必要最小限のインターフェース
- **D**ependency Inversion (依存性逆転): 抽象に依存、具象に依存しない

#### 2. DRY原則 (Don't Repeat Yourself)

**同じコードが3回以上出現したら即座にリファクタリング**

❌ **悪い例**: 4種類のタグCRUDで同じコードをコピペ
```typescript
// line-tags/route.ts (79行)
// usage-tags/route.ts (82行)  ← 完全に同じロジック
// sim-location-tags/route.ts (79行)
// line-reserve-tags/route.ts (79行)
```

✅ **良い例**: 汎用コントローラーで統一
```typescript
// @repo/shared の汎用関数を使用
export const GET = withErrorHandling(async (req) => {
  return await getTagList(req, prisma, config);
});
```

#### 3. コードレビュー前の自己チェック

以下に該当する場合は**必ずリファクタリング**:
- [ ] 1ファイルが推奨行数を超えている
- [ ] 同じコードが3回以上出現している
- [ ] 1つの関数/コンポーネントが複数の責任を持っている
- [ ] ネストが5階層以上ある
- [ ] 他の開発者が理解するのに5分以上かかりそう

---

### ファイルサイズ制限

**推奨最大行数** (コメント・空行含む):

| ファイル種別 | 推奨最大 | 警告ライン | 絶対最大 |
|------------|---------|----------|---------|
| API Route | 100行 | 150行 | 200行 |
| Page Component | 200行 | 300行 | 400行 |
| Client Component | 150行 | 200行 | 300行 |
| Custom Hook | 100行 | 150行 | 200行 |
| Utility Function | 50行 | 100行 | 150行 |
| Service/Repository | 200行 | 300行 | 400行 |

**超過時の対処**:
1. **即座に分割を検討**
2. **ユーザーに相談** (迷ったら必ず相談)
3. **リファクタリング計画を立てる**

---

### API Routes設計規約（SayaTrade Pattern）

#### 必須ルール

1. **APIルートは薄いレイヤー（最大10行）**
   - ビジネスロジックは全てController層に
   - HTTPリクエストをControllerに渡すだけ

2. **Controllerでバリデーションとエラーハンドリング**
   - リクエストの検証
   - エラーの適切な変換
   - レスポンスの整形

3. **ビジネスロジックはService層**
   - 複数のRepositoryを組み合わせた処理
   - トランザクション管理
   - ビジネスルールの実装

4. **データアクセスはRepository層**
   - Prismaクライアントの直接利用
   - クエリの最適化
   - データの永続化

5. **複数クエリは並列実行**
   ```typescript
   // ❌ 直列実行
   const users = await prisma.user.findMany();
   const posts = await prisma.post.findMany();

   // ✅ 並列実行
   const [users, posts] = await Promise.all([
     prisma.user.findMany(),
     prisma.post.findMany(),
   ]);
   ```

#### APIルートテンプレート（SayaTrade Pattern）

```typescript
// src/app/api/[resource]/route.ts (最大10行)
import { NextRequest } from "next/server";
import { getAllResources, createResource } from "@/src/controllers/resource.controller";

export async function GET(request: NextRequest) {
  return await getAllResources(request);
}

export async function POST(request: NextRequest) {
  return await createResource(request);
}
```

```typescript
// src/app/api/[resource]/[id]/route.ts (最大15行)
import { NextRequest } from "next/server";
import {
  getResourceById,
  updateResource,
  deleteResource
} from "@/src/controllers/resource.controller";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return await getResourceById(id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return await updateResource(id, request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return await deleteResource(id);
}
```

---

### Component設計規約

#### 必須ルール

1. **単一責任原則を厳守**
   - 1コンポーネント = 1つの明確な役割
   - UIとロジックを分離

2. **推奨最大150行**
   - 超過時は即座に分割

3. **Props数は最大8個**
   - 超過時はオブジェクトにまとめる

4. **深いネストは禁止**
   - 最大4階層まで
   - 超過時はサブコンポーネントに抽出

#### 分割基準

**Dialogコンポーネント (例: csv-import-dialog.tsx 604行)**
```
❌ 1ファイルに全ステップを含む (604行)

✅ ステップごとに分割
csv-import-dialog/
  ├── csv-import-dialog.tsx        (100行) - 状態管理・ステップ制御
  ├── steps/
  │   ├── supplier-select-step.tsx (80行)  - 仕入れ先選択
  │   ├── file-upload-step.tsx     (100行) - ファイルアップロード
  │   ├── column-mapping-step.tsx  (120行) - カラムマッピング
  │   └── preview-step.tsx         (100行) - プレビュー・実行
  └── hooks/
      └── use-csv-import.ts        (100行) - インポートロジック
```

**管理画面コンポーネント (例: tag-manager.tsx 403行)**
```
❌ CRUD全部入り (403行)

✅ 機能ごとに分割
tags/
  ├── tag-list.tsx           (100行) - 一覧表示
  ├── tag-table.tsx          (80行)  - テーブルUI
  ├── tag-form-dialog.tsx    (120行) - 作成・編集フォーム
  ├── tag-delete-dialog.tsx  (50行)  - 削除確認
  └── hooks/
      └── use-tag-mutations.ts (80行) - CRUD mutations
```

#### Componentテンプレート

```typescript
// components/[feature]/[component-name].tsx
"use client";

import { useState } from "react";
import { Button, Card } from "@repo/ui";
import { useFeature } from "@/hooks/use-feature";

interface ComponentNameProps {
  id: string;
  onSuccess?: () => void;
}

export function ComponentName({ id, onSuccess }: ComponentNameProps) {
  const { data, isLoading } = useFeature(id);

  if (isLoading) return <LoadingSpinner />;
  if (!data) return <EmptyState />;

  return (
    <Card>
      <ComponentNameContent data={data} onSuccess={onSuccess} />
    </Card>
  );
}

// サブコンポーネントは同じファイルか別ファイルに分離
function ComponentNameContent({ data, onSuccess }: {
  data: Data;
  onSuccess?: () => void;
}) {
  // 実装
}
```

---

### Page設計規約

#### 必須ルール

1. **Page Component自体は最大200行**
   - それ以上はセクションコンポーネントに分割

2. **責任分離**
   - Page: レイアウト・セクション配置のみ
   - Section Component: 各セクションのUI
   - Custom Hook: データフェッチ・状態管理

3. **Server ComponentとClient Componentの使い分け**
   - デフォルトはServer Component
   - インタラクションが必要な部分のみClient Component

#### 分割基準

**超大規模Page (例: applications/[id]/page.tsx 1,334行)**
```
❌ 全機能を1ファイルに (1,334行)

✅ セクションごとに分割
applications/[id]/
  ├── page.tsx                       (150行) - レイアウト
  ├── components/
  │   ├── customer-info-section.tsx  (180行) - 顧客情報
  │   ├── kyc-section.tsx           (200行) - KYC画像管理
  │   ├── lines-section.tsx         (250行) - 回線一覧・編集
  │   ├── iccid-scan-modal.tsx      (150行) - ICCIDスキャン
  │   └── archive-section.tsx       (100行) - アーカイブ
  └── hooks/
      ├── use-application-detail.ts  (100行) - 詳細データ取得
      ├── use-kyc-mutations.ts       (80行)  - KYC操作
      └── use-line-mutations.ts      (100行) - 回線操作
```

**大規模一覧Page (例: lines/lines-client.tsx 938行)**
```
❌ フィルタ・テーブル・編集が1ファイル (938行)

✅ 機能ごとに分割
lines/
  ├── lines-client.tsx              (150行) - 統合・状態管理
  ├── components/
  │   ├── lines-filter.tsx          (120行) - フィルタUI
  │   ├── lines-table.tsx           (200行) - テーブル表示
  │   ├── line-row.tsx              (150行) - 行コンポーネント
  │   └── bulk-edit-toolbar.tsx     (100行) - 一括編集UI
  └── hooks/
      ├── use-lines-filter.ts       (100行) - フィルタロジック
      └── use-lines-mutations.ts    (120行) - CRUD操作
```

#### Pageテンプレート

```typescript
// app/(auth)/[feature]/page.tsx (Server Component)
import { Suspense } from "react";
import { FeatureClient } from "./feature-client";
import { LoadingSkeleton } from "@/components/loading-skeleton";

export default function FeaturePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Feature Name</h1>
      <Suspense fallback={<LoadingSkeleton />}>
        <FeatureClient />
      </Suspense>
    </div>
  );
}
```

```typescript
// app/(auth)/[feature]/feature-client.tsx (Client Component)
"use client";

import { FeatureFilter } from "./components/feature-filter";
import { FeatureTable } from "./components/feature-table";
import { useFeature } from "@/hooks/use-feature";

export function FeatureClient() {
  const { data, filters, setFilters } = useFeature();

  return (
    <div className="space-y-6">
      <FeatureFilter filters={filters} onChange={setFilters} />
      <FeatureTable data={data} />
    </div>
  );
}
```

---

### Custom Hooks設計規約

#### 必須ルール

1. **1 Hook = 1つの責任**
   - データフェッチ専用
   - Mutation専用
   - UI状態管理専用

2. **推奨最大100行**
   - 超過時は機能ごとに分割

3. **命名規則**
   - `use[Feature][Action]`: `useApplicationCreate`, `useLineFilter`
   - `use[Feature]`: 統合Hook (複数のHookをまとめる)

#### 分割基準

**巨大Hook (例: use-procurement.ts 213行)**
```
❌ CRUD + 画像 + CSVを1ファイルに (213行)

✅ 機能ごとに分割
hooks/
  ├── use-procurement.ts              (80行)  - 統合Hook
  ├── use-procurement-list.ts         (60行)  - 一覧取得
  ├── use-procurement-mutations.ts    (80行)  - CRUD操作
  ├── use-procurement-image-upload.ts (60行)  - 画像アップロード
  └── use-procurement-csv-import.ts   (80行)  - CSVインポート
```

#### Hookテンプレート

```typescript
// hooks/use-[feature]-list.ts (データフェッチ専用)
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";

export function useFeatureList(filters?: FeatureFilters) {
  return useQuery({
    queryKey: queryKeys.features.list(filters),
    queryFn: () => api.getFeatures(filters),
    staleTime: 30000, // 30秒キャッシュ
  });
}
```

```typescript
// hooks/use-[feature]-mutations.ts (Mutation専用)
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { toast } from "sonner";

export function useFeatureMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: api.createFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.features.all });
      toast.success("作成しました");
    },
    onError: () => {
      toast.error("作成に失敗しました");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FeatureData }) =>
      api.updateFeature(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.features.all });
      toast.success("更新しました");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.features.all });
      toast.success("削除しました");
    },
  });

  return {
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
```

---

### ディレクトリ構造規約

#### Feature-based組織化

**技術別分類 (❌ 避けるべき)**
```
src/
  ├── components/     ← procurement, tags, suppliers全部混在
  ├── hooks/          ← 全機能のHookが混在
  ├── lib/            ← 全ユーティリティが混在
  └── app/
      └── api/        ← 全APIルートが混在
```

**Feature-based分類 (✅ 推奨)**
```
src/
  ├── features/
  │   ├── procurement/         # 仕入れ管理機能
  │   │   ├── api/            # API Routes
  │   │   ├── components/     # UI Components
  │   │   ├── hooks/          # Custom Hooks
  │   │   ├── types/          # 型定義
  │   │   └── lib/            # ユーティリティ
  │   │
  │   ├── applications/       # 申込管理機能
  │   │   ├── api/
  │   │   ├── pages/          # Page Components
  │   │   ├── components/
  │   │   └── hooks/
  │   │
  │   ├── tags/               # タグ管理機能 (共通)
  │   │   ├── api/
  │   │   ├── components/
  │   │   └── hooks/
  │   │
  │   └── sims/               # SIM管理機能
  │       ├── api/
  │       ├── pages/
  │       ├── components/
  │       └── hooks/
  │
  └── shared/                 # 完全共通
      ├── components/         # 全機能で使うUI
      ├── hooks/              # 全機能で使うHook
      ├── lib/                # 全機能で使うユーティリティ
      └── types/              # 全機能で使う型
```

#### 移行ルール

1. **新機能は必ずFeature-based構造で作成**
2. **既存機能の修正時に徐々に移行**
3. **完全共通のものだけ`shared/`に配置**

---

### Query最適化規約

#### 必須ルール

1. **必要なフィールドのみ取得**
   ```typescript
   // ❌ 全フィールド取得
   await prisma.application.findMany()

   // ✅ 必要なフィールドのみ
   await prisma.application.findMany({
     select: {
       id: true,
       applicationNumber: true,
       customer: {
         select: {
           lastName: true,
           firstName: true,
         }
       }
     }
   })
   ```

2. **includeは最小限に**
   ```typescript
   // ❌ 過剰なinclude
   include: {
     customer: true,        // 全フィールド
     lines: true,           // 全フィールド
     service: true,         // 全フィールド
     plan: true,            // 全フィールド
   }

   // ✅ 必要な部分のみselect
   include: {
     customer: {
       select: {
         lastName: true,
         firstName: true,
       }
     },
     _count: {
       select: {
         lines: true,
       }
     }
   }
   ```

3. **N+1クエリの防止**
   ```typescript
   // ❌ N+1クエリ
   const applications = await prisma.application.findMany();
   for (const app of applications) {
     const customer = await prisma.customer.findUnique({
       where: { id: app.customerId }
     });
   }

   // ✅ 1回のクエリで取得
   const applications = await prisma.application.findMany({
     include: {
       customer: {
         select: {
           lastName: true,
           firstName: true,
         }
       }
     }
   });
   ```

4. **複数クエリは並列実行**
   ```typescript
   // ❌ 直列実行
   const applications = await prisma.application.findMany();
   const customers = await prisma.customer.findMany();
   const lines = await prisma.applicationLine.findMany();

   // ✅ 並列実行
   const [applications, customers, lines] = await Promise.all([
     prisma.application.findMany(),
     prisma.customer.findMany(),
     prisma.applicationLine.findMany(),
   ]);
   ```

5. **適切なINDEX追加**
   ```prisma
   model ApplicationLine {
     // WHERE句とJOIN条件に使われるカラムの組み合わせ
     @@index([status, applicationId])
     @@index([simId])
     @@index([contractId])
   }
   ```

---

### 実装前チェックリスト

新機能を実装する前に必ず確認:

#### 設計フェーズ
- [ ] この機能は既存のどの機能に似ているか？再利用できるコードはないか？
- [ ] APIルートは@repo/sharedの汎用関数を使えるか？
- [ ] 同じパターンが3回以上出現しないか？
- [ ] ファイルサイズは推奨最大行数以内に収まるか?
- [ ] Feature-based構造で配置できるか？

#### 実装フェーズ
- [ ] 各ファイルは単一責任を持っているか？
- [ ] ネストは4階層以内か？
- [ ] Propsは8個以内か？
- [ ] Queryは最適化されているか？(select, 並列実行)
- [ ] エラーハンドリングは適切か？

#### レビューフェーズ
- [ ] ファイルサイズが推奨最大行数を超えていないか？
- [ ] 同じコードが重複していないか？
- [ ] 他の開発者が理解できるコードか？
- [ ] テストは書けるか？
- [ ] パフォーマンスは許容範囲か？

---

### トラブルシューティング

#### ファイルが肥大化してしまった場合

1. **即座に分割を検討**
2. **以下の順序で対処**:
   - ステップ1: 重複コードを共通関数に抽出
   - ステップ2: サブコンポーネント/サブ関数に分割
   - ステップ3: 機能ごとに別ファイルに分離
   - ステップ4: Feature-based構造に移行

#### 同じコードが複数箇所にある場合

1. **3回以上の重複は即座にリファクタリング**
2. **共通化の手順**:
   - ステップ1: 共通部分を特定
   - ステップ2: 汎用的な関数/コンポーネントに抽出
   - ステップ3: `@repo/shared`または`features/shared/`に配置
   - ステップ4: 全ての箇所を共通関数に置き換え

#### 迷ったら

**必ずユーザーに相談すること。勝手に決めない。**

---

## Controller → Service → Repository パターン（Clean Architecture）

**参考実装**: SayaTrade-master

### アーキテクチャ概要

```
API Route (薄いレイヤー、10行)
    ↓
Controller (バリデーション、エラーハンドリング)
    ↓
Service (ビジネスロジック)
    ↓
Repository (データアクセス)
    ↓
Prisma Client
```

### 各層の責任

#### 1. API Route (`app/api/[resource]/route.ts`)

**責任**: HTTPリクエストをコントローラーに渡すだけ（最大10行）

```typescript
// app/api/companies/route.ts
import { NextRequest } from 'next/server';
import { getAllCompanies, createCompany } from '@/src/controllers/company.controller';

export async function GET(request: NextRequest) {
  return await getAllCompanies(request);
}

export async function POST(request: NextRequest) {
  return await createCompany(request);
}
```

#### 2. Controller (`src/controllers/[resource].controller.ts`)

**責任**:
- リクエストのバリデーション
- エラーハンドリング
- レスポンスの整形
- サービス層の呼び出し

```typescript
// src/controllers/company.controller.ts
import { NextRequest, NextResponse } from 'next/server';
import { CompanyService } from '../services/company.service';
import { validateId, validateCompanyData } from '../shared/validators/validators';
import { handleCustomError } from '../shared/errors/api-errors';

const companyService = new CompanyService();

export async function getAllCompanies(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const companies = await companyService.getAllCompaniesWithRelations();

    return NextResponse.json({
      companies: companies.slice((page - 1) * limit, page * limit),
      pagination: { page, limit, total: companies.length }
    });
  } catch (error) {
    const customError = handleCustomError(error);
    if (customError) return customError;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function createCompany(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.json();

    // バリデーション
    const validation = validateCompanyData(data);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const company = await companyService.createCompany(data);
    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    const customError = handleCustomError(error);
    if (customError) return customError;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

#### 3. Service (`src/services/[resource].service.ts`)

**責任**:
- ビジネスロジックの実装
- 複数のRepositoryを組み合わせた処理
- トランザクション管理

```typescript
// src/services/company.service.ts
import { CompanyRepository } from '../repositories/company.repository';
import { NotFoundError } from '../shared/errors/custom-errors';

export class CompanyService {
  private companyRepository: CompanyRepository;

  constructor() {
    this.companyRepository = new CompanyRepository();
  }

  async getAllCompanies() {
    return await this.companyRepository.findAll();
  }

  async getAllCompaniesWithRelations() {
    return await this.companyRepository.findAllWithRelations();
  }

  async getCompanyById(id: number) {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new NotFoundError('企業');
    }
    return company;
  }

  async createCompany(data: { name: string }) {
    return await this.companyRepository.create(data);
  }

  async updateCompany(id: number, data: { name: string }) {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new NotFoundError('企業');
    }
    return await this.companyRepository.update(id, data);
  }

  async deleteCompany(id: number) {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new NotFoundError('企業');
    }
    await this.companyRepository.delete(id);
  }
}
```

#### 4. Repository (`src/repositories/[resource].repository.ts`)

**責任**:
- Prismaクライアントを使ったデータアクセス
- クエリの最適化（select, include, index）
- データの永続化

```typescript
// src/repositories/company.repository.ts
import { prisma } from '../infrastructure/database/prisma';

export class CompanyRepository {
  async findAll() {
    return await prisma.company.findMany({
      orderBy: { id: 'desc' }
    });
  }

  async findAllWithRelations() {
    return await prisma.company.findMany({
      orderBy: { id: 'desc' },
      include: {
        pairs: true,
        assets: true
      }
    });
  }

  async findById(id: number) {
    return await prisma.company.findUnique({
      where: { id },
      include: {
        pairs: true,
        assets: true
      }
    });
  }

  async create(data: { name: string }) {
    return await prisma.company.create({
      data: { name: data.name }
    });
  }

  async update(id: number, data: { name: string }) {
    return await prisma.company.update({
      where: { id },
      data: { name: data.name }
    });
  }

  async delete(id: number) {
    await prisma.company.delete({
      where: { id }
    });
  }
}
```

### メリット

1. **テスタビリティ**: 各層を独立してテスト可能
2. **保守性**: 責任が明確、変更の影響範囲が限定的
3. **拡張性**: 新機能追加時に既存コードへの影響が少ない
4. **再利用性**: Service/Repositoryは複数のControllerから使用可能
5. **APIルートの肥大化防止**: APIルートは常に10行程度

### 実装チェックリスト

新しいリソースを追加する際:

- [ ] `src/domain/entities/[resource].entity.ts` - エンティティ定義
- [ ] `src/domain/interfaces/[resource].repository.interface.ts` - Repository interface
- [ ] `src/repositories/[resource].repository.ts` - Repository実装
- [ ] `src/services/[resource].service.ts` - Service実装
- [ ] `src/controllers/[resource].controller.ts` - Controller実装
- [ ] `src/app/api/[resource]/route.ts` - APIルート（薄いレイヤー）
- [ ] `src/app/api/[resource]/[id]/route.ts` - 詳細APIルート

---

### 参考: Clean Architectureパターン（SayaTrade実装）

本プロジェクトでは以下のレイヤー構造を採用:

```
┌─────────────────────────────────────┐
│  Presentation Layer (UI)            │
│  - Pages (src/app/)                 │
│  - Components (src/components/)     │
│  - Hooks (src/hooks/)               │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Application Layer (Use Cases)      │
│  - API Routes (src/app/api/)        │ ← 薄いレイヤー（10行）
│  - Controllers (src/controllers/)   │ ← バリデーション・エラー処理
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Domain Layer (Business Logic)      │
│  - Services (src/services/)         │ ← ビジネスロジック
│  - Repositories (src/repositories/) │ ← データアクセス
│  - Domain Models (src/domain/)      │ ← エンティティ・VO
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Infrastructure Layer (Data)        │
│  - Database (src/infrastructure/)   │ ← Prismaクライアント
│  - External APIs                    │ ← 外部サービス
│  - @repo/database (Prisma Schema)   │ ← スキーマ定義
└─────────────────────────────────────┘
```

**各レイヤーの責任（SayaTrade方式）**:
- **Presentation**: ユーザーインターフェース、表示ロジック
- **Application**:
  - API Route: HTTPリクエストをControllerに渡す（10行）
  - Controller: バリデーション、エラーハンドリング、レスポンス整形
- **Domain**:
  - Service: ビジネスルール、トランザクション管理
  - Repository: データ操作、クエリ最適化
- **Infrastructure**: データ永続化、外部サービス連携

**重要**:
- 各アプリ（admin, buppan, versus, avaris）は独自の Controller/Service/Repository を持つ
- 完全に共通の機能のみ packages/ で共有（@repo/entities, @repo/utils, @repo/database）
- packages/shared は段階的に廃止し、各アプリ内に移行
