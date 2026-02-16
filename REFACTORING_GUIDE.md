# supermobile-Lines リファクタリングガイド

## 📚 目次
1. [アーキテクチャ概要](#アーキテクチャ概要)
2. [新規API追加方法](#新規api追加方法)
3. [既存API修正方法](#既存api修正方法)
4. [ベストプラクティス](#ベストプラクティス)
5. [トラブルシューティング](#トラブルシューティング)

---

## アーキテクチャ概要

### ディレクトリ構造
```
supermobile-Lines/
├── packages/shared/src/           # 共通パッケージ
│   ├── domain/entities/          # ドメインエンティティ定義
│   ├── repositories/             # データアクセス層
│   ├── services/                 # ビジネスロジック層
│   ├── controllers/              # HTTPリクエスト処理層
│   ├── shared/                   # ユーティリティ
│   └── index.ts                  # エクスポート管理
│
└── apps/[service]/src/app/api/   # 各アプリのルート
    └── [endpoint]/route.ts       # 薄いルート層（平均11行）
```

### レイヤー責務

#### 1. Entity層 (domain/entities/)
**責務**: データ構造とインターフェース定義
```typescript
// cancellation.entity.ts
export interface CancellationRequest {
  lineId: string;
  reason?: string;
}

export interface CancellationResult {
  success: boolean;
}
```

#### 2. Repository層 (repositories/)
**責務**: データベースクエリの抽象化
```typescript
// application.repository.ts
export class ApplicationRepository {
  async findById(id: string): Promise<Application | null> {
    return await this.prisma.application.findUnique({ where: { id } });
  }
}
```

#### 3. Service層 (services/)
**責務**: ビジネスロジックの実装
```typescript
// cancellation.service.ts
export class CancellationService {
  async requestCancellation(
    userId: string,
    request: CancellationRequest
  ): Promise<CancellationResult> {
    // ビジネスルール検証
    // データ操作
    // ログ記録
  }
}
```

#### 4. Controller層 (controllers/)
**責務**: HTTPリクエスト/レスポンス処理、バリデーション
```typescript
// cancellation.controller.ts
export async function requestCancellation(
  request: NextRequest,
  prisma: PrismaClient,
  authFn: () => Promise<Session>
) {
  // 1. 認証チェック
  // 2. リクエストバリデーション (Zod)
  // 3. Serviceコール
  // 4. レスポンス返却
}
```

#### 5. Route層 (apps/*/src/app/api/)
**責務**: 依存性の注入のみ
```typescript
// apps/avaris/src/app/api/customer/cancel/route.ts
export async function POST(request: NextRequest) {
  return await requestCancellation(request, prisma, auth);
}
```

---

## 新規API追加方法

### ステップ1: Entity定義
```typescript
// packages/shared/src/domain/entities/new-feature.entity.ts
export interface NewFeatureInput {
  field1: string;
  field2: number;
}

export interface NewFeatureResult {
  success: boolean;
  data?: SomeData;
}
```

### ステップ2: Service作成
```typescript
// packages/shared/src/services/new-feature.service.ts
import { PrismaClient } from "@repo/database";
import { NewFeatureInput, NewFeatureResult } from "../domain/entities/new-feature.entity";
import { logger } from "../shared/utils/logger";

export class NewFeatureService {
  constructor(private prisma: PrismaClient) {}

  async executeFeature(input: NewFeatureInput): Promise<NewFeatureResult> {
    // ビジネスロジック実装
    logger.info("New feature executed", { input });
    return { success: true };
  }
}
```

### ステップ3: Controller作成
```typescript
// packages/shared/src/controllers/new-feature.controller.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@repo/database";
import { NewFeatureService } from "../services/new-feature.service";
import { z } from "zod";
import { handleApiError } from "../shared/errors/api-errors";

const newFeatureSchema = z.object({
  field1: z.string().min(1),
  field2: z.number().int().positive(),
});

export async function executeNewFeature(
  request: NextRequest,
  prisma: PrismaClient,
  authFn?: () => Promise<{ user?: { id?: string } } | null>
) {
  try {
    // 認証が必要な場合
    if (authFn) {
      const session = await authFn();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
      }
    }

    // バリデーション
    const body = await request.json();
    const validation = newFeatureSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Service実行
    const service = new NewFeatureService(prisma);
    const result = await service.executeFeature(validation.data);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### ステップ4: index.ts更新
```typescript
// packages/shared/src/index.ts
export * from './domain/entities/new-feature.entity';
export * from './services/new-feature.service';
export { executeNewFeature } from './controllers/new-feature.controller';
```

### ステップ5: 各アプリにルート追加
```typescript
// apps/avaris/src/app/api/new-feature/route.ts
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { executeNewFeature } from "@repo/shared";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return await executeNewFeature(request, prisma, auth);
}
```

同様に他の4アプリ（buppan, machinegun, maeda, versus）にも追加。

---

## 既存API修正方法

### パターン1: ビジネスロジック変更
**修正箇所**: Service層のみ
```typescript
// packages/shared/src/services/cancellation.service.ts
async requestCancellation(...) {
  // ビジネスルール変更
  // 例: 解約可能な条件を追加
  if (line.status !== "ACTIVATED" && line.status !== "SHIPPED") {
    throw new ValidationError("この回線は解約申請できません");
  }
  
  // 新しい条件追加
  if (line.contractEndDate && new Date() < line.contractEndDate) {
    throw new ValidationError("契約期間中は解約できません");
  }
}
```
→ 5アプリすべてに自動反映

### パターン2: バリデーション変更
**修正箇所**: Controller層のみ
```typescript
// packages/shared/src/controllers/cancellation.controller.ts
const cancellationSchema = z.object({
  lineId: z.string().uuid("正しいUUID形式で指定してください"), // 追加
  reason: z.string().min(10, "理由は10文字以上で入力してください").optional(), // 変更
});
```

### パターン3: レスポンス形式変更
**修正箇所**: Entity → Service → Controller
```typescript
// 1. Entity更新
export interface CancellationResult {
  success: boolean;
  cancellationId?: string; // 追加
  estimatedProcessingDate?: Date; // 追加
}

// 2. Service更新
async requestCancellation(...): Promise<CancellationResult> {
  // ...
  return { 
    success: true,
    cancellationId: newId,
    estimatedProcessingDate: calculateDate()
  };
}

// Controller層は自動的に新しい型に対応
```

---

## ベストプラクティス

### 1. エラーハンドリング
```typescript
// ❌ 悪い例
throw new Error("エラーが発生しました");

// ✅ 良い例
import { ValidationError, NotFoundError } from "../shared/errors/custom-errors";

if (!data) {
  throw new NotFoundError("データが見つかりません");
}

if (invalid) {
  throw new ValidationError("無効なデータです");
}
```

### 2. ログ記録
```typescript
// ❌ 悪い例
console.log("処理完了");

// ✅ 良い例
import { logger } from "../shared/utils/logger";

logger.info("Cancellation processed", { 
  userId,
  lineId,
  timestamp: new Date()
});
```

### 3. トランザクション
```typescript
// ✅ 複数テーブル更新時は必ずトランザクション使用
await this.prisma.$transaction(async (tx) => {
  await tx.applicationLine.update(...);
  await tx.application.update(...);
  await tx.auditLog.create(...);
});
```

### 4. Dependency Injection
```typescript
// ✅ テスト可能性を保つため、外部依存は注入
export async function myController(
  request: NextRequest,
  prisma: PrismaClient,
  authFn: () => Promise<Session>,      // 注入
  uploadFileFn: (file) => Promise<Url>, // 注入
  sendEmailFn: (to, body) => Promise<void> // 注入
) { ... }
```

### 5. マルチテナント対応
```typescript
// ✅ サービスコードでアプリを識別
const serviceConfig = getServiceConfig("avaris");
const applicationNumber = `${serviceConfig.applicationPrefix}${date}${random}`;
```

---

## トラブルシューティング

### Q1: 型エラーが出る
```bash
# 共通パッケージのビルド
cd packages/shared
npm run build

# 各アプリのビルド
cd apps/avaris
npm run build
```

### Q2: import が解決されない
```typescript
// ✅ 必ず index.ts から import
import { requestCancellation } from "@repo/shared";

// ❌ 直接 import しない
import { requestCancellation } from "@repo/shared/controllers/cancellation.controller";
```

### Q3: 新しいEntityが認識されない
```typescript
// packages/shared/src/index.ts に追加されているか確認
export * from './domain/entities/new-entity.entity';
```

### Q4: Prismaクライアントエラー
```bash
# Prisma再生成
cd packages/database
npx prisma generate
```

---

## コーディング規約

### ファイル命名
- Entity: `{domain}.entity.ts`
- Service: `{domain}.service.ts`
- Controller: `{domain}.controller.ts`
- Repository: `{domain}.repository.ts`

### クラス命名
- Service: `{Domain}Service`
- Repository: `{Domain}Repository`

### 関数命名
- Controller: `{verb}{Domain}` (例: `requestCancellation`, `getCustomerDashboard`)
- Service: `{verb}{Domain}` (例: `requestCancellation`, `getCustomerDashboard`)

---

**最終更新**: 2026-02-16
**削減行数**: 9,936行
**アーキテクチャ**: Clean Architecture + Dependency Injection
