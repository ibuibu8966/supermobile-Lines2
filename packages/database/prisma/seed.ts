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
        name: "物販サービス",
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: "versus" },
      update: {},
      create: {
        code: "versus",
        name: "バーサス",
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { code: "avaris" },
      update: {},
      create: {
        code: "avaris",
        name: "Avaris",
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
        name: "ポケカ認証",
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
  ]);
  console.log(`Created ${usageTags.length} usage tags`);

  // 4. プランマスタ（物販サービス用）
  const buppanService = services.find((s) => s.code === "buppan")!;
  const pokekaTag = usageTags.find((t) => t.code === "pokeka")!;
  const adaafiTag = usageTags.find((t) => t.code === "adaafi")!;

  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { serviceId_code: { serviceId: buppanService.id, code: "pokeka-basic" } },
      update: {},
      create: {
        serviceId: buppanService.id,
        code: "pokeka-basic",
        name: "ポケカ認証プラン",
        isActive: true,
      },
    }),
    prisma.plan.upsert({
      where: { serviceId_code: { serviceId: buppanService.id, code: "adaafi-basic" } },
      update: {},
      create: {
        serviceId: buppanService.id,
        code: "adaafi-basic",
        name: "アドアフィプラン",
        isActive: true,
      },
    }),
  ]);
  console.log(`Created ${plans.length} plans`);

  // 5. プラン-用途タグ紐付け
  const pokekaplan = plans.find((p) => p.code === "pokeka-basic")!;
  const adaafiPlan = plans.find((p) => p.code === "adaafi-basic")!;

  await Promise.all([
    prisma.planUsageTag.upsert({
      where: { planId_usageTagId: { planId: pokekaplan.id, usageTagId: pokekaTag.id } },
      update: {},
      create: {
        planId: pokekaplan.id,
        usageTagId: pokekaTag.id,
      },
    }),
    prisma.planUsageTag.upsert({
      where: { planId_usageTagId: { planId: adaafiPlan.id, usageTagId: adaafiTag.id } },
      update: {},
      create: {
        planId: adaafiPlan.id,
        usageTagId: adaafiTag.id,
      },
    }),
  ]);
  console.log("Created plan-usage tag relations");

  // 6. プラン料金テーブル（回線数ベースの階層料金）
  await Promise.all([
    // ポケカプラン - 通常料金
    prisma.planPricing.upsert({
      where: { id: "pokeka-tier-1" },
      update: {},
      create: {
        id: "pokeka-tier-1",
        planId: pokekaplan.id,
        minQuantity: 1,
        maxQuantity: 49,
        unitPrice: 3980,
        description: "1〜49回線",
      },
    }),
    // ポケカプラン - 大量割引
    prisma.planPricing.upsert({
      where: { id: "pokeka-tier-2" },
      update: {},
      create: {
        id: "pokeka-tier-2",
        planId: pokekaplan.id,
        minQuantity: 50,
        maxQuantity: null,
        unitPrice: 3480,
        description: "50回線以上（割引）",
      },
    }),
    // アドアフィプラン - 通常料金
    prisma.planPricing.upsert({
      where: { id: "adaafi-tier-1" },
      update: {},
      create: {
        id: "adaafi-tier-1",
        planId: adaafiPlan.id,
        minQuantity: 1,
        maxQuantity: null,
        unitPrice: 4980,
        description: "回線数無制限",
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
