import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. サービスマスタ
  const services = await Promise.all([
    prisma.service.upsert({
      where: { code: "buppan" },
      update: {},
      create: {
        code: "buppan",
        name: "BUPPAN MOBILE",
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: "versus" },
      update: {},
      create: {
        code: "versus",
        name: "VERSUS MOBILE",
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: "avaris" },
      update: {},
      create: {
        code: "avaris",
        name: "Avaris Mobile",
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: "machinegun" },
      update: {},
      create: {
        code: "machinegun",
        name: "Machinegun Mobile",
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: "maeda" },
      update: {},
      create: {
        code: "maeda",
        name: "モバイル前田",
        isActive: true,
      },
    }),
  ]);
  console.log(`Created ${services.length} services`);

  // 2. 仕入れ先マスタ
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { code: "arts" },
      update: {},
      create: {
        code: "arts",
        name: "アーツ",
        isActive: true,
      },
    }),
    prisma.supplier.upsert({
      where: { code: "linklife" },
      update: {},
      create: {
        code: "linklife",
        name: "リンクライフ",
        isActive: true,
      },
    }),
    prisma.supplier.upsert({
      where: { code: "other" },
      update: {},
      create: {
        code: "other",
        name: "その他",
        isActive: true,
      },
    }),
  ]);
  console.log(`Created ${suppliers.length} suppliers`);

  // 3. 用途タグマスタ
  const usageTags = await Promise.all([
    prisma.usageTag.upsert({
      where: { code: "pokeka" },
      update: {},
      create: {
        code: "pokeka",
        name: "SMS認証",
        category: "認証系",
        description: "ポケモンカード関連の認証用途",
        displayOrder: 1,
      },
    }),
    prisma.usageTag.upsert({
      where: { code: "adaafi" },
      update: {},
      create: {
        code: "adaafi",
        name: "アドアフィ",
        category: "認証系",
        description: "アドアフィリエイト用途",
        displayOrder: 2,
      },
    }),
    prisma.usageTag.upsert({
      where: { code: "mnp" },
      update: {},
      create: {
        code: "mnp",
        name: "MNP弾",
        category: "MNP系",
        description: "MNP転出用途",
        displayOrder: 3,
      },
    }),
    prisma.usageTag.upsert({
      where: { code: "general" },
      update: {},
      create: {
        code: "general",
        name: "一般利用",
        category: "一般",
        description: "通常の携帯電話利用",
        displayOrder: 4,
      },
    }),
    prisma.usageTag.upsert({
      where: { code: "auth" },
      update: {},
      create: {
        code: "auth",
        name: "認証用",
        category: "認証系",
        description: "SMS認証用途",
        displayOrder: 5,
      },
    }),
  ]);
  console.log(`Created ${usageTags.length} usage tags`);

  // サービス参照
  const buppanService = services.find((s) => s.code === "buppan")!;
  const versusService = services.find((s) => s.code === "versus")!;
  const avarisService = services.find((s) => s.code === "avaris")!;
  const machinegunService = services.find((s) => s.code === "machinegun")!;
  const maedaService = services.find((s) => s.code === "maeda")!;

  // 古いプランを無効化（正しいプランコード以外を非アクティブに）
  await Promise.all([
    prisma.plan.updateMany({
      where: { serviceId: buppanService.id, code: { notIn: ["buppan-3month"] } },
      data: { isActive: false },
    }),
    prisma.plan.updateMany({
      where: { serviceId: versusService.id, code: { notIn: ["versus-auth"] } },
      data: { isActive: false },
    }),
    prisma.plan.updateMany({
      where: { serviceId: avarisService.id, code: { notIn: ["avaris-auth"] } },
      data: { isActive: false },
    }),
    prisma.plan.updateMany({
      where: { serviceId: machinegunService.id, code: { notIn: ["machinegun-pokeka"] } },
      data: { isActive: false },
    }),
    prisma.plan.updateMany({
      where: { serviceId: maedaService.id, code: { notIn: ["maeda-auth"] } },
      data: { isActive: false },
    }),
  ]);
  console.log("Deactivated old plans");

  // タグ参照
  const pokekaTag = usageTags.find((t) => t.code === "pokeka")!;
  const authTag = usageTags.find((t) => t.code === "auth")!;

  // 4. プランマスタ
  const plans = await Promise.all([
    // ===== BUPPAN プラン =====
    prisma.plan.upsert({
      where: { serviceId_code: { serviceId: buppanService.id, code: "buppan-3month" } },
      update: {},
      create: {
        serviceId: buppanService.id,
        code: "buppan-3month",
        name: "3ヶ月パック",
        description: "SIM登録・個別配送込み",
        features: ["音声通話付き", "最短翌営業日発送", "法人契約対応"],
        isActive: true,
      },
    }),

    // ===== VERSUS プラン =====
    prisma.plan.upsert({
      where: { serviceId_code: { serviceId: versusService.id, code: "versus-auth" } },
      update: {},
      create: {
        serviceId: versusService.id,
        code: "versus-auth",
        name: "認証用SIMプラン",
        description: "SMS・音声・データ対応、当月末自動解約",
        features: ["音声通話・SMS対応", "最短翌営業日発送", "各種認証対応"],
        isActive: true,
      },
    }),

    // ===== AVARIS プラン =====
    prisma.plan.upsert({
      where: { serviceId_code: { serviceId: avarisService.id, code: "avaris-auth" } },
      update: {},
      create: {
        serviceId: avarisService.id,
        code: "avaris-auth",
        name: "認証用SIM",
        description: "事務手数料込み・翌月末自動解約",
        features: ["音声通話付き", "最短翌営業日発送", "法人契約対応"],
        isActive: true,
      },
    }),

    // ===== MACHINEGUN プラン =====
    prisma.plan.upsert({
      where: { serviceId_code: { serviceId: machinegunService.id, code: "machinegun-pokeka" } },
      update: {},
      create: {
        serviceId: machinegunService.id,
        code: "machinegun-pokeka",
        name: "SMS認証専用SIM",
        description: "10回線単位、MNP転出不可",
        features: ["音声通話付き", "最短翌営業日発送", "法人契約対応"],
        isActive: true,
      },
    }),
    // ===== MAEDA プラン =====
    prisma.plan.upsert({
      where: { serviceId_code: { serviceId: maedaService.id, code: "maeda-auth" } },
      update: {},
      create: {
        serviceId: maedaService.id,
        code: "maeda-auth",
        name: "認証用SIMプラン",
        description: "SMS・音声・データ対応",
        features: ["音声通話付き", "最短翌営業日発送", "法人契約対応"],
        isActive: true,
      },
    }),
  ]);
  console.log(`Created ${plans.length} plans`);

  // プラン参照
  const buppan3monthPlan = plans.find((p) => p.code === "buppan-3month")!;
  const versusAuthPlan = plans.find((p) => p.code === "versus-auth")!;
  const avarisAuthPlan = plans.find((p) => p.code === "avaris-auth")!;
  const machinegunPokekaPlan = plans.find((p) => p.code === "machinegun-pokeka")!;
  const maedaAuthPlan = plans.find((p) => p.code === "maeda-auth")!;

  // 5. プラン-用途タグ紐付け
  await Promise.all([
    // BUPPAN
    prisma.planUsageTag.upsert({
      where: { planId_usageTagId: { planId: buppan3monthPlan.id, usageTagId: authTag.id } },
      update: {},
      create: { planId: buppan3monthPlan.id, usageTagId: authTag.id },
    }),
    // VERSUS
    prisma.planUsageTag.upsert({
      where: { planId_usageTagId: { planId: versusAuthPlan.id, usageTagId: authTag.id } },
      update: {},
      create: { planId: versusAuthPlan.id, usageTagId: authTag.id },
    }),
    // AVARIS
    prisma.planUsageTag.upsert({
      where: { planId_usageTagId: { planId: avarisAuthPlan.id, usageTagId: authTag.id } },
      update: {},
      create: { planId: avarisAuthPlan.id, usageTagId: authTag.id },
    }),
    // MACHINEGUN
    prisma.planUsageTag.upsert({
      where: { planId_usageTagId: { planId: machinegunPokekaPlan.id, usageTagId: pokekaTag.id } },
      update: {},
      create: { planId: machinegunPokekaPlan.id, usageTagId: pokekaTag.id },
    }),
    // MAEDA
    prisma.planUsageTag.upsert({
      where: { planId_usageTagId: { planId: maedaAuthPlan.id, usageTagId: authTag.id } },
      update: {},
      create: { planId: maedaAuthPlan.id, usageTagId: authTag.id },
    }),
  ]);
  console.log("Created plan-usage tag relations");

  // 6. プラン料金テーブル
  await Promise.all([
    // ===== BUPPAN 3ヶ月パック =====
    // 50回線未満: ¥4,600
    prisma.planPricing.upsert({
      where: { id: "buppan-3month-tier-1" },
      update: {},
      create: {
        id: "buppan-3month-tier-1",
        planId: buppan3monthPlan.id,
        minQuantity: 1,
        maxQuantity: 49,
        unitPrice: 4600,
        description: "50回線未満",
      },
    }),
    // 50回線以上: ¥4,200
    prisma.planPricing.upsert({
      where: { id: "buppan-3month-tier-2" },
      update: {},
      create: {
        id: "buppan-3month-tier-2",
        planId: buppan3monthPlan.id,
        minQuantity: 50,
        maxQuantity: null,
        unitPrice: 4200,
        description: "50回線以上",
      },
    }),

    // ===== VERSUS 認証用SIMプラン =====
    // 50回線未満: ¥3,600
    prisma.planPricing.upsert({
      where: { id: "versus-auth-tier-1" },
      update: {},
      create: {
        id: "versus-auth-tier-1",
        planId: versusAuthPlan.id,
        minQuantity: 1,
        maxQuantity: 49,
        unitPrice: 3600,
        description: "50回線未満",
      },
    }),
    // 50回線以上: ¥3,300
    prisma.planPricing.upsert({
      where: { id: "versus-auth-tier-2" },
      update: {},
      create: {
        id: "versus-auth-tier-2",
        planId: versusAuthPlan.id,
        minQuantity: 50,
        maxQuantity: null,
        unitPrice: 3300,
        description: "50回線以上",
      },
    }),

    // ===== AVARIS 認証用SIM =====
    // 100回線未満: ¥3,200
    prisma.planPricing.upsert({
      where: { id: "avaris-auth-tier-1" },
      update: {},
      create: {
        id: "avaris-auth-tier-1",
        planId: avarisAuthPlan.id,
        minQuantity: 1,
        maxQuantity: 99,
        unitPrice: 3200,
        description: "100回線未満",
      },
    }),
    // 100回線以上: ¥3,100
    prisma.planPricing.upsert({
      where: { id: "avaris-auth-tier-2" },
      update: {},
      create: {
        id: "avaris-auth-tier-2",
        planId: avarisAuthPlan.id,
        minQuantity: 100,
        maxQuantity: null,
        unitPrice: 3100,
        description: "100回線以上",
      },
    }),

    // ===== MACHINEGUN SMS認証専用SIM =====
    // 単一料金: ¥3,300（10回線単位）
    prisma.planPricing.upsert({
      where: { id: "machinegun-pokeka-tier-1" },
      update: {},
      create: {
        id: "machinegun-pokeka-tier-1",
        planId: machinegunPokekaPlan.id,
        minQuantity: 10,
        maxQuantity: null,
        unitPrice: 3300,
        description: "10回線単位",
      },
    }),

    // ===== MAEDA 認証用SIMプラン =====
    // 50回線未満: ¥3,600
    prisma.planPricing.upsert({
      where: { id: "maeda-auth-tier-1" },
      update: {},
      create: {
        id: "maeda-auth-tier-1",
        planId: maedaAuthPlan.id,
        minQuantity: 1,
        maxQuantity: 49,
        unitPrice: 3600,
        description: "50回線未満",
      },
    }),
    // 50回線以上: ¥3,300
    prisma.planPricing.upsert({
      where: { id: "maeda-auth-tier-2" },
      update: {},
      create: {
        id: "maeda-auth-tier-2",
        planId: maedaAuthPlan.id,
        minQuantity: 50,
        maxQuantity: null,
        unitPrice: 3300,
        description: "50回線以上",
      },
    }),
  ]);
  console.log("Created plan pricings");

  // 7. テスト用管理者ユーザー
  const hashedPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "buppan-admin@example.com" },
    update: {},
    create: {
      email: "buppan-admin@example.com",
      password: hashedPassword,
      role: "ADMIN",
      serviceId: buppanService.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "versus-admin@example.com" },
    update: {},
    create: {
      email: "versus-admin@example.com",
      password: hashedPassword,
      role: "ADMIN",
      serviceId: versusService.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "avaris-admin@example.com" },
    update: {},
    create: {
      email: "avaris-admin@example.com",
      password: hashedPassword,
      role: "ADMIN",
      serviceId: avarisService.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "machinegun-admin@example.com" },
    update: {},
    create: {
      email: "machinegun-admin@example.com",
      password: hashedPassword,
      role: "ADMIN",
      serviceId: machinegunService.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "maeda-admin@example.com" },
    update: {},
    create: {
      email: "maeda-admin@example.com",
      password: hashedPassword,
      role: "ADMIN",
      serviceId: maedaService.id,
      isActive: true,
    },
  });
  console.log("Created test admin users");

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
