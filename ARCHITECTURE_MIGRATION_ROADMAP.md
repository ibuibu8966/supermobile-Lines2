# レイヤードアーキテクチャ移行ロードマップ

**開始日**: 2026-02-16
**対象**: supermobile-Lines プロジェクト
**目標**: モノリシックroute.ts → Repository/Service/Controllerパターン

---

## 📊 現在の進捗状況

### ✅ Phase 1: バグ修正（完了）
- Critical/High バグ 5件修正
- 共通バリデーション関数実装
- 型安全性向上
- [詳細レポート: BUGFIX_PHASE1.md](./BUGFIX_PHASE1.md)

### ✅ Phase 2: 基盤整備（完了 - 本日実施）

**実装した基盤コンポーネント:**

#### 1. エラーハンドリングシステム
`packages/shared/src/errors/`

- **custom-errors.ts**: 8種類のカスタムエラークラス
  - `NotFoundError` (404)
  - `ValidationError` (400)
  - `UnauthorizedError` (401)
  - `ForbiddenError` (403)
  - `ConflictError` (409)
  - `BadRequestError` (400)
  - `BusinessRuleError` (422)
  - `DataIntegrityError` (409)

- **api-errors.ts**: 統合エラーハンドラ
  - `handleApiError()`: 全エラータイプ自動判別
  - `handleZodError()`: Zodバリデーションエラー処理
  - `handlePrismaError()`: Prismaエラー処理（P2002, P2025等）
  - `withErrorHandling()`: 非同期関数ラッパー

#### 2. ロガーシステム
`packages/shared/src/utils/logger.ts`

- 構造化ログ出力
- 開発環境: カラー付き整形出力
- 本番環境: JSON形式（ログ収集ツール対応）
- メソッド: `info()`, `warn()`, `error()`, `debug()`, `logError()`

#### 3. ヘルパー関数
`packages/shared/src/utils/helpers.ts`

- `createPaginationInfo()`: ページネーション情報生成
- `removeNullish()`: null/undefined除去
- `chunk()`: 配列分割
- `retry()`: リトライ機能付き関数実行

#### 4. Entity定義
`packages/shared/src/domain/entities/application.entity.ts`

- `ApplicationEntity`: 基本エンティティ
- `ApplicationWithRelations`: リレーション付き
- `ApplicationCreateInput`: 作成時入力
- `ApplicationUpdateInput`: 更新時入力
- `ApplicationStats`: 統計情報
- Enum: `ApplicationStatus`, `KycStatus`, `PaymentStatus`, `AddressStatus`

#### 5. Repository層（サンプル実装）
`packages/shared/src/repositories/application.repository.ts`

- `ApplicationRepository`: 申込データアクセス層
- メソッド:
  - `findMany()`: フィルタ＋ページネーション
  - `findById()`: ID検索
  - `create()`: 作成
  - `update()`: 更新
  - `delete()`: 削除
  - `exists()`: 存在確認
  - `findByCustomerIds()`: 顧客IDから検索

---

## 🎯 Phase 3以降の実装計画

### Phase 3: Service層の実装（予定: Week 3-4）

**目標**: ビジネスロジックをService層に集約

#### 実装するServiceクラス

1. **ApplicationService** (優先度: 最高)
```typescript
class ApplicationService {
  constructor(
    private applicationRepo: ApplicationRepository,
    private customerRepo: CustomerRepository,
    private couponRepo: CouponRepository
  ) {}

  async getApplicationList(
    filters: ApplicationFilters,
    pagination: PaginationParams,
    session: AdminSession
  ): Promise<{ applications: Application[]; pagination: PaginationInfo }> {
    // 1. Repository経由でデータ取得
    const { applications, total } = await this.applicationRepo.findMany(
      filters,
      pagination,
      session.scopedServiceId
    );

    // 2. ビジネスロジック: 統計計算
    const enrichedApplications = this.enrichWithStats(applications);

    // 3. ビジネスロジック: 申込順序計算
    const withOrdinals = await this.addApplicationOrdinals(enrichedApplications);

    // 4. ページネーション情報生成
    const paginationInfo = createPaginationInfo(pagination.page, pagination.pageSize, total);

    return { applications: withOrdinals, pagination: paginationInfo };
  }

  private enrichWithStats(applications: Application[]): Application[] {
    // 回線統計を計算（shipped/notActivated/returned）
  }

  private async addApplicationOrdinals(applications: Application[]): Promise<Application[]> {
    // 顧客ごとの申込順序を計算
  }

  async createApplication(input: CreateApplicationInput): Promise<Application> {
    // トランザクション処理
    // KYC画像アップロード（補償トランザクション付き）
  }
}
```

2. **LineService** (優先度: 高)
3. **SimService** (優先度: 高)
4. **UserService** (優先度: 中)
5. **CouponService** (優先度: 中)

#### 推定工数
- ApplicationService: 2日
- LineService: 2日
- その他Service: 各1日
- **合計**: 1.5週間

---

### Phase 4: Controller層の実装（予定: Week 5-6）

**目標**: APIハンドラを薄いControllerに

#### 実装するControllerクラス

```typescript
// packages/shared/src/controllers/application.controller.ts
export async function getAllApplications(request: NextRequest) {
  // 1. 認証チェック
  const session = await getAdminSession();
  if (session instanceof NextResponse) return session;

  // 2. パラメータパース
  const { searchParams } = new URL(request.url);
  const filters = parseApplicationFilters(searchParams);
  const pagination = parsePaginationParams(searchParams);

  // 3. Service呼び出し
  const applicationService = new ApplicationService(
    new ApplicationRepository(prisma),
    new CustomerRepository(prisma),
    new CouponRepository(prisma)
  );

  const result = await applicationService.getApplicationList(
    filters,
    pagination,
    session
  );

  // 4. レスポンス
  return NextResponse.json({
    data: result.applications,
    pagination: result.pagination,
  });
}
```

#### route.tsのリファクタリング

**Before (207行)**:
```typescript
export async function GET(request: NextRequest) {
  try {
    // 認証チェック (10行)
    // パラメータパース (20行)
    // whereクエリ構築 (50行)
    // Prismaクエリ実行 (70行)
    // 統計計算 (30行)
    // レスポンス整形 (20行)
  } catch (error) {
    // エラーハンドリング (7行)
  }
}
```

**After (8行)**:
```typescript
import { getAllApplications } from '@repo/shared/controllers/application.controller';
import { withErrorHandling } from '@repo/shared';

export const GET = withErrorHandling(getAllApplications);
```

#### 推定工数
- ApplicationController: 1日
- LineController: 1日
- その他Controller: 各0.5日
- route.tsリファクタリング: 2日
- **合計**: 1週間

---

### Phase 5: 残りのRepository/Service実装（予定: Week 7-8）

#### 実装リスト

| Entity | Repository | Service | Controller | 優先度 |
|--------|-----------|---------|-----------|--------|
| Line | LineRepository | LineService | LineController | 高 |
| Sim | SimRepository | SimService | SimController | 高 |
| User | UserRepository | UserService | UserController | 中 |
| Coupon | CouponRepository | CouponService | CouponController | 中 |
| Service | ServiceRepository | ServiceService | ServiceController | 低 |
| Plan | PlanRepository | PlanService | PlanController | 低 |
| Supplier | SupplierRepository | SupplierService | SupplierController | 低 |

#### 推定工数
- 高優先度（3エンティティ）: 6日
- 中優先度（2エンティティ）: 3日
- 低優先度（3エンティティ）: 2日
- **合計**: 2週間

---

### Phase 6: テスト実装（予定: Week 9-10）

#### テスト戦略

**1. Unit Tests（単体テスト）**
```typescript
// tests/unit/repositories/application.repository.test.ts
describe('ApplicationRepository', () => {
  let repo: ApplicationRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    repo = new ApplicationRepository(mockPrisma);
  });

  it('findByIdは存在しない場合nullを返す', async () => {
    mockPrisma.application.findUnique.mockResolvedValue(null);
    const result = await repo.findById('non-existent');
    expect(result).toBeNull();
  });

  it('アーカイブフィルタが正しく動作', async () => {
    await repo.findMany({ includeArchived: false }, { skip: 0, take: 10 });
    expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isArchived: false }
      })
    );
  });
});
```

**2. Integration Tests（統合テスト）**
```typescript
// tests/integration/applications.test.ts
describe('Application作成フロー', () => {
  let testDb: PrismaClient;

  beforeAll(async () => {
    testDb = await setupTestDatabase();
  });

  it('正常系: 申込から回線割当まで', async () => {
    const service = await testDb.service.create({ data: testServiceData });
    const plan = await testDb.plan.create({ data: testPlanData });

    const repo = new ApplicationRepository(testDb);
    const application = await repo.create({
      serviceId: service.id,
      planId: plan.id,
      lineCount: 10,
      // ...
    });

    expect(application.lines).toHaveLength(10);
  });
});
```

**3. E2E Tests（エンドツーエンドテスト）**
```typescript
// tests/e2e/application-flow.test.ts
describe('申込フロー E2E', () => {
  it('顧客登録 → 申込 → KYCアップロード → 承認', async () => {
    // 1. 申込作成
    const createRes = await fetch('/api/applications', {
      method: 'POST',
      body: createFormData({ /* ... */ })
    });
    expect(createRes.status).toBe(201);

    // 2. 管理者セッションで取得
    const adminRes = await fetch('/api/applications?search=' + applicationNumber);
    expect(adminRes.status).toBe(200);
  });
});
```

#### テストカバレッジ目標
- Repository層: 80%
- Service層: 70%
- Controller層: 60%
- **全体目標**: 65%

#### 推定工数
- テスト環境構築: 2日
- Unit Tests実装: 3日
- Integration Tests実装: 3日
- E2E Tests実装: 2日
- **合計**: 2週間

---

## 📅 タイムライン

| Phase | 内容 | 期間 | 状態 |
|-------|------|------|------|
| Phase 1 | バグ修正 | Week 1 | ✅ 完了 |
| Phase 2 | 基盤整備 | Week 2 | ✅ 完了 |
| **Phase 3** | **Service層実装** | **Week 3-4** | **→ 次** |
| Phase 4 | Controller層実装 | Week 5-6 | 予定 |
| Phase 5 | 残りのRepository/Service | Week 7-8 | 予定 |
| Phase 6 | テスト実装 | Week 9-10 | 予定 |
| Phase 7 | パフォーマンス最適化 | Week 11-12 | 予定 |

**総工数**: 12週間（3ヶ月）

---

## 🎯 次のステップ: Phase 3 開始

### 優先順位

**Week 3（最初の1週間）**:
1. **ApplicationService実装** (2日)
   - `getApplicationList()`
   - `getApplicationById()`
   - `createApplication()`
   - `updateApplication()`

2. **ApplicationController実装** (1日)
   - `getAllApplications()`
   - `getApplicationById()`
   - `updateApplication()`

3. **route.tsリファクタリング** (1日)
   - `/api/applications/route.ts`
   - `/api/applications/[id]/route.ts`

4. **動作確認＋修正** (1日)

**Week 4（次の1週間）**:
- LineService/LineController実装
- SimService/SimController実装
- 動作確認

---

## 🔧 実装済みコンポーネント一覧

### packages/shared/src/

```
shared/src/
├── domain/
│   └── entities/
│       └── application.entity.ts ✅
├── repositories/
│   └── application.repository.ts ✅
├── errors/
│   ├── custom-errors.ts ✅
│   └── api-errors.ts ✅
├── utils/
│   ├── validation.ts ✅
│   ├── logger.ts ✅
│   └── helpers.ts ✅
└── index.ts ✅
```

### まだ実装していないもの

```
shared/src/
├── services/          (← Phase 3で実装)
│   ├── application.service.ts
│   ├── line.service.ts
│   └── ...
├── controllers/       (← Phase 4で実装)
│   ├── application.controller.ts
│   ├── line.controller.ts
│   └── ...
└── __tests__/        (← Phase 6で実装)
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 💡 実装Tips

### 1. 依存性注入パターン

```typescript
// Service層
class ApplicationService {
  constructor(
    private applicationRepo: ApplicationRepository,
    private customerRepo: CustomerRepository
  ) {}
}

// Controller層
export async function getAllApplications(request: NextRequest) {
  const applicationService = new ApplicationService(
    new ApplicationRepository(prisma),
    new CustomerRepository(prisma)
  );
  // ...
}
```

### 2. エラーハンドリング

```typescript
// withErrorHandling()を使用
export const GET = withErrorHandling(async (request: NextRequest) => {
  // エラーが発生してもhandleApiError()が自動処理
  throw new NotFoundError('申込');
});
```

### 3. トランザクション処理

```typescript
class ApplicationService {
  async createApplication(input: CreateApplicationInput): Promise<Application> {
    return await this.prisma.$transaction(async (tx) => {
      const customer = await new CustomerRepository(tx).create(input.customer);
      const application = await new ApplicationRepository(tx).create({
        ...input,
        customerId: customer.id,
      });
      return application;
    });
  }
}
```

---

## ⚠️ 注意事項

### 破壊的変更を避けるために

1. **Feature Flag導入**
   - 環境変数: `USE_LAYERED_ARCHITECTURE=true/false`
   - 新旧コード並行稼働

2. **段階的ロールアウト**
   - 5% → 10% → 25% → 50% → 100%
   - メトリクス監視（エラーレート、レスポンスタイム）

3. **ロールバック準備**
   - gitタグでバージョン管理
   - エラーレート>1%で自動ロールバック

### テスト必須項目

- [ ] 既存APIの全エンドポイントが動作
- [ ] レスポンス形式が変わっていない
- [ ] パフォーマンスが劣化していない（P95 < 500ms）
- [ ] エラーハンドリングが正しく動作
- [ ] 権限チェック（ADMIN/SUPER_ADMIN）が正しく動作

---

## 📊 期待される効果

### コード品質
- ✅ route.ts: 平均150行 → 8行（**95%削減**）
- ✅ 重複コード削減: 120ファイル → 30ファイル（**75%削減**）
- ✅ 型安全性向上
- ✅ テストカバレッジ: 0% → 65%

### 開発速度
- ✅ 新規API作成: 1-2時間 → 20分（**80%短縮**）
- ✅ バグ修正: 4箇所 → 1箇所（**75%短縮**）
- ✅ コードレビュー: 200行 → 10行（**95%削減**）

### 保守性
- ✅ レイヤー分離で責務明確化
- ✅ 再利用可能なコンポーネント
- ✅ 統一されたエラーハンドリング
- ✅ 構造化ロギング

---

**次のアクション**: Phase 3（ApplicationService実装）を開始しますか？
