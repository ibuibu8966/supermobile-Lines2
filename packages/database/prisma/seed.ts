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
    update: { name: "野田 システム管理者" },
    create: {
      email: "admin@example.com",
      name: "野田 システム管理者",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "buppan-admin@example.com" },
    update: { name: "田中 二郎" },
    create: {
      email: "buppan-admin@example.com",
      name: "田中 二郎",
      password: hashedPassword,
      role: "ADMIN",
      serviceId: buppanService.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "versus-admin@example.com" },
    update: { name: "中村 健太" },
    create: {
      email: "versus-admin@example.com",
      name: "中村 健太",
      password: hashedPassword,
      role: "ADMIN",
      serviceId: versusService.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "avaris-admin@example.com" },
    update: { name: "高橋 美咲" },
    create: {
      email: "avaris-admin@example.com",
      name: "高橋 美咲",
      password: hashedPassword,
      role: "ADMIN",
      serviceId: avarisService.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "machinegun-admin@example.com" },
    update: { name: "伊藤 大輔" },
    create: {
      email: "machinegun-admin@example.com",
      name: "伊藤 大輔",
      password: hashedPassword,
      role: "ADMIN",
      serviceId: machinegunService.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "maeda-admin@example.com" },
    update: { name: "前田 隆司" },
    create: {
      email: "maeda-admin@example.com",
      name: "前田 隆司",
      password: hashedPassword,
      role: "ADMIN",
      serviceId: maedaService.id,
      isActive: true,
    },
  });

  // 従業員ユーザー
  await prisma.user.upsert({
    where: { email: "employee1@example.com" },
    update: { name: "小林 さやか" },
    create: {
      email: "employee1@example.com",
      name: "小林 さやか",
      password: hashedPassword,
      role: "EMPLOYEE",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "employee2@example.com" },
    update: { name: "渡辺 拓也" },
    create: {
      email: "employee2@example.com",
      name: "渡辺 拓也",
      password: hashedPassword,
      role: "EMPLOYEE",
      isActive: true,
    },
  });

  console.log("Created test admin users");

  // 8. タグマスタ（SimLocationTag, LineTag, LineReserveTag）
  const simLocationTags = await Promise.all([
    prisma.simLocationTag.upsert({
      where: { code: "tokyo-office" },
      update: {},
      create: { code: "tokyo-office", name: "東京オフィス", displayOrder: 1 },
    }),
    prisma.simLocationTag.upsert({
      where: { code: "osaka-office" },
      update: {},
      create: { code: "osaka-office", name: "大阪オフィス", displayOrder: 2 },
    }),
    prisma.simLocationTag.upsert({
      where: { code: "warehouse" },
      update: {},
      create: { code: "warehouse", name: "倉庫", displayOrder: 3 },
    }),
  ]);
  console.log(`Created ${simLocationTags.length} SIM location tags`);

  const lineTags = await Promise.all([
    prisma.lineTag.upsert({
      where: { code: "priority" },
      update: {},
      create: { code: "priority", name: "優先配送", displayOrder: 1 },
    }),
    prisma.lineTag.upsert({
      where: { code: "urgent" },
      update: {},
      create: { code: "urgent", name: "至急", displayOrder: 2 },
    }),
    prisma.lineTag.upsert({
      where: { code: "normal" },
      update: {},
      create: { code: "normal", name: "通常", displayOrder: 3 },
    }),
  ]);
  console.log(`Created ${lineTags.length} line tags`);

  const lineReserveTags = await Promise.all([
    prisma.lineReserveTag.upsert({
      where: { code: "reserved-vip" },
      update: {},
      create: { code: "reserved-vip", name: "VIP予約", displayOrder: 1 },
    }),
    prisma.lineReserveTag.upsert({
      where: { code: "reserved-corporate" },
      update: {},
      create: { code: "reserved-corporate", name: "法人予約", displayOrder: 2 },
    }),
  ]);
  console.log(`Created ${lineReserveTags.length} line reserve tags`);

  // 9. SIMデータ
  const artsSupplier = suppliers.find((s) => s.code === "arts")!;
  const linklifeSupplier = suppliers.find((s) => s.code === "linklife")!;
  const tokyoLocation = simLocationTags.find((t) => t.code === "tokyo-office")!;
  const osakaLocation = simLocationTags.find((t) => t.code === "osaka-office")!;

  const sims = [];
  for (let i = 1; i <= 50; i++) {
    const iccid = `8981100000000${String(i).padStart(5, "0")}`;
    const msisdn = `090${String(8000 + i).padStart(8, "0")}`;
    const sim = await prisma.sim.upsert({
      where: { iccid },
      update: {},
      create: {
        iccid,
        msisdn,
        supplierId: i % 2 === 0 ? artsSupplier.id : linklifeSupplier.id,
        simType: i % 5 === 0 ? "CORPORATE" : "INDIVIDUAL",
        carrierType: ["DOCOMO", "AU", "SOFTBANK", "RAKUTEN"][i % 4] as any,
        plan: "標準プラン",
        status: i <= 30 ? "IN_STOCK" : i <= 40 ? "ACTIVE" : "RETURNING",
        simLocationTagId: i % 2 === 0 ? tokyoLocation.id : osakaLocation.id,
        eligibleTagIds: [authTag.id, pokekaTag.id],
      },
    });
    sims.push(sim);
  }
  console.log(`Created ${sims.length} SIMs`);

  // 10. テスト用顧客データ
  const testCustomerPassword = await bcrypt.hash("customer123", 12);

  const testUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: "customer1@example.com" },
      update: {},
      create: {
        email: "customer1@example.com",
        password: testCustomerPassword,
        role: "CUSTOMER",
        serviceId: buppanService.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "customer2@example.com" },
      update: {},
      create: {
        email: "customer2@example.com",
        password: testCustomerPassword,
        role: "CUSTOMER",
        serviceId: versusService.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "customer3@example.com" },
      update: {},
      create: {
        email: "customer3@example.com",
        password: testCustomerPassword,
        role: "CUSTOMER",
        serviceId: avarisService.id,
        isActive: true,
      },
    }),
  ]);

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: "customer1@example.com" },
      update: {},
      create: {
        userId: testUsers[0].id,
        type: "INDIVIDUAL",
        email: "customer1@example.com",
        phone: "09012345678",
        lastName: "山田",
        firstName: "太郎",
        lastNameKana: "ヤマダ",
        firstNameKana: "タロウ",
        birthDate: new Date("1990-01-15"),
        postalCode: "1000001",
        prefecture: "東京都",
        city: "千代田区",
        address: "千代田1-1-1",
        building: "サンプルビル101",
        status: "ACTIVE",
      },
    }),
    prisma.customer.upsert({
      where: { email: "customer2@example.com" },
      update: {},
      create: {
        userId: testUsers[1].id,
        type: "CORPORATE",
        email: "customer2@example.com",
        phone: "09087654321",
        lastName: "佐藤",
        firstName: "花子",
        lastNameKana: "サトウ",
        firstNameKana: "ハナコ",
        birthDate: new Date("1985-05-20"),
        postalCode: "5300001",
        prefecture: "大阪府",
        city: "大阪市北区",
        address: "梅田2-2-2",
        companyName: "テスト株式会社",
        companyNameKana: "テストカブシキガイシャ",
        establishedDate: new Date("2015-04-01"),
        companyPostalCode: "5300001",
        companyPrefecture: "大阪府",
        companyCity: "大阪市北区",
        companyAddress: "梅田2-2-2",
        companyBuilding: "オフィスタワー5F",
        status: "ACTIVE",
      },
    }),
    prisma.customer.upsert({
      where: { email: "customer3@example.com" },
      update: {},
      create: {
        userId: testUsers[2].id,
        type: "INDIVIDUAL",
        email: "customer3@example.com",
        phone: "08011112222",
        lastName: "鈴木",
        firstName: "一郎",
        lastNameKana: "スズキ",
        firstNameKana: "イチロウ",
        birthDate: new Date("1992-08-10"),
        postalCode: "2310023",
        prefecture: "神奈川県",
        city: "横浜市中区",
        address: "山下町1-1",
        status: "ACTIVE",
      },
    }),
  ]);
  console.log(`Created ${customers.length} customers`);

  // 11. クーポンデータ
  const coupons = await Promise.all([
    prisma.coupon.upsert({
      where: { code: "WELCOME2024" },
      update: {},
      create: {
        code: "WELCOME2024",
        planId: buppan3monthPlan.id,
        unitPrice: 4000,
        description: "新規登録キャンペーン",
        maxUsages: 100,
        usageCount: 5,
        validFrom: new Date("2024-01-01"),
        validUntil: new Date("2024-12-31"),
        isActive: true,
      },
    }),
    prisma.coupon.upsert({
      where: { code: "SPRING50" },
      update: {},
      create: {
        code: "SPRING50",
        planId: versusAuthPlan.id,
        unitPrice: 3000,
        description: "春の特別割引（50回線以上）",
        maxUsages: 50,
        usageCount: 2,
        validFrom: new Date("2024-03-01"),
        validUntil: new Date("2024-05-31"),
        isActive: true,
      },
    }),
  ]);
  console.log(`Created ${coupons.length} coupons`);

  // 12. 申込データ
  const priorityLineTag = lineTags.find((t) => t.code === "priority")!;
  const normalLineTag = lineTags.find((t) => t.code === "normal")!;

  const application1 = await prisma.application.upsert({
    where: { applicationNumber: "APP2024010001" },
    update: {},
    create: {
      applicationNumber: "APP2024010001",
      customerId: customers[0].id,
      serviceId: buppanService.id,
      planId: buppan3monthPlan.id,
      lineCount: 10,
      unitPrice: 4600,
      totalAmount: 46000,
      status: "COMPLETED",
      kycStatus: "COMPLETED",
      paymentStatus: "PAID",
      addressStatus: "COMPLETED",
      paidAt: new Date("2024-01-15"),
      couponId: coupons[0].id,
      couponCode: "WELCOME2024",
      comment1: "優良顧客",
      comment2: "迅速な対応を希望",
    },
  });

  const application2 = await prisma.application.upsert({
    where: { applicationNumber: "APP2024010002" },
    update: {},
    create: {
      applicationNumber: "APP2024010002",
      customerId: customers[1].id,
      serviceId: versusService.id,
      planId: versusAuthPlan.id,
      lineCount: 50,
      unitPrice: 3300,
      totalAmount: 165000,
      status: "SHIPPING",
      kycStatus: "COMPLETED",
      paymentStatus: "PAID",
      addressStatus: "COMPLETED",
      paidAt: new Date("2024-01-16"),
    },
  });

  const application3 = await prisma.application.upsert({
    where: { applicationNumber: "APP2024010003" },
    update: {},
    create: {
      applicationNumber: "APP2024010003",
      customerId: customers[2].id,
      serviceId: avarisService.id,
      planId: avarisAuthPlan.id,
      lineCount: 20,
      unitPrice: 3200,
      totalAmount: 64000,
      status: "PAYMENT_PENDING",
      kycStatus: "PENDING",
      paymentStatus: "BEFORE_INVOICE",
      addressStatus: "PENDING",
    },
  });
  console.log("Created 3 applications");

  // 13. 申込回線データ
  for (let i = 0; i < 10; i++) {
    await prisma.applicationLine.upsert({
      where: { applicationId_lineNumber: { applicationId: application1.id, lineNumber: i + 1 } },
      update: {},
      create: {
        applicationId: application1.id,
        lineNumber: i + 1,
        simId: sims[i].iccid,
        msisdn: sims[i].msisdn,
        status: "ACTIVATED",
        lineTagId: i < 5 ? priorityLineTag.id : normalLineTag.id,
        shippedAt: new Date("2024-01-16"),
      },
    });
  }

  for (let i = 0; i < 50; i++) {
    await prisma.applicationLine.upsert({
      where: { applicationId_lineNumber: { applicationId: application2.id, lineNumber: i + 1 } },
      update: {},
      create: {
        applicationId: application2.id,
        lineNumber: i + 1,
        status: "SHIPPED",
        lineTagId: normalLineTag.id,
        shippedAt: new Date("2024-01-17"),
      },
    });
  }

  for (let i = 0; i < 20; i++) {
    await prisma.applicationLine.upsert({
      where: { applicationId_lineNumber: { applicationId: application3.id, lineNumber: i + 1 } },
      update: {},
      create: {
        applicationId: application3.id,
        lineNumber: i + 1,
        status: "NOT_ACTIVATED",
        lineTagId: normalLineTag.id,
      },
    });
  }
  console.log("Created application lines");

  // 14. KYC画像データ
  await prisma.kycImage.upsert({
    where: { id: "kyc-image-1" },
    update: {},
    create: {
      id: "kyc-image-1",
      applicationId: application1.id,
      type: "ID_FRONT",
      storagePath: "kyc/customer1/id_front.jpg",
      status: "APPROVED",
      reviewedAt: new Date("2024-01-15"),
      reviewNote: "確認完了",
    },
  });

  await prisma.kycImage.upsert({
    where: { id: "kyc-image-2" },
    update: {},
    create: {
      id: "kyc-image-2",
      applicationId: application1.id,
      type: "ID_BACK",
      storagePath: "kyc/customer1/id_back.jpg",
      status: "APPROVED",
      reviewedAt: new Date("2024-01-15"),
    },
  });

  await prisma.kycImage.upsert({
    where: { id: "kyc-image-3" },
    update: {},
    create: {
      id: "kyc-image-3",
      applicationId: application2.id,
      type: "CORPORATE_REGISTRY",
      storagePath: "kyc/customer2/registry.pdf",
      status: "APPROVED",
      reviewedAt: new Date("2024-01-16"),
      reviewNote: "法人確認完了",
    },
  });

  await prisma.kycImage.upsert({
    where: { id: "kyc-image-4" },
    update: {},
    create: {
      id: "kyc-image-4",
      applicationId: application3.id,
      type: "ID_FRONT",
      storagePath: "kyc/customer3/id_front.jpg",
      status: "PENDING",
    },
  });
  console.log("Created KYC images");

  // 15. 契約データ
  for (let i = 0; i < 10; i++) {
    const contract = await prisma.contract.create({
      data: {
        iccid: sims[i].iccid,
        serviceName: "buppan",
        customerId: customers[0].id,
        contractStart: new Date("2024-01-16"),
        contractEnd: new Date("2024-04-16"),
        status: "ACTIVE",
        shippedAt: new Date("2024-01-16"),
        arrivedAt: new Date("2024-01-17"),
        msisdnSnapshot: sims[i].msisdn,
      },
    });

    // 用途タグを契約に紐付け
    await prisma.contractUsageTag.create({
      data: {
        contractId: contract.id,
        usageTagId: authTag.id,
        note: "認証用途として利用",
      },
    });

    // SIMの状態を更新
    await prisma.sim.update({
      where: { iccid: sims[i].iccid },
      data: {
        status: "ACTIVE",
        currentContractId: contract.id,
        consumedTagIds: [authTag.id],
      },
    });
  }
  console.log("Created contracts and contract usage tags");

  // 16. 発注データ（PurchaseOrder + PurchaseOrderLine）
  // 発注1: ドコモ100枚
  await prisma.purchaseOrder.create({
    data: {
      supplierId: artsSupplier.id,
      totalAmount: 100000,
      status: "DELIVERED",
      orderedAt: new Date("2024-01-01"),
      invoiceDate: new Date("2024-01-05"),
      deliveryDate: new Date("2024-01-10"),
      note: "初回発注分、納品完了",
      lines: {
        create: [
          { carrierType: "DOCOMO", quantity: 100, unitPrice: 1000, subtotal: 100000 },
        ],
      },
    },
  });

  // 発注2: au50枚
  await prisma.purchaseOrder.create({
    data: {
      supplierId: linklifeSupplier.id,
      totalAmount: 47500,
      status: "AWAITING_DELIVERY",
      orderedAt: new Date("2024-01-15"),
      invoiceDate: new Date("2024-01-20"),
      note: "au回線、納品待ち",
      lines: {
        create: [
          { carrierType: "AU", quantity: 50, unitPrice: 950, subtotal: 47500 },
        ],
      },
    },
  });

  // 発注3: ソフトバンク200枚
  await prisma.purchaseOrder.create({
    data: {
      supplierId: artsSupplier.id,
      totalAmount: 220000,
      status: "BEFORE_PAYMENT",
      orderedAt: new Date("2024-01-20"),
      invoiceDate: new Date("2024-01-25"),
      note: "ソフトバンク回線、大口発注",
      lines: {
        create: [
          { carrierType: "SOFTBANK", quantity: 200, unitPrice: 1100, subtotal: 220000 },
        ],
      },
    },
  });

  // 発注4: 楽天30枚
  await prisma.purchaseOrder.create({
    data: {
      supplierId: linklifeSupplier.id,
      totalAmount: 24000,
      status: "AWAITING_SEAL",
      orderedAt: new Date("2024-01-25"),
      note: "楽天回線、印鑑待ち",
      lines: {
        create: [
          { carrierType: "RAKUTEN", quantity: 30, unitPrice: 800, subtotal: 24000 },
        ],
      },
    },
  });

  // 発注5: 複数キャリア混在（ドコモ500 + 楽天500）
  await prisma.purchaseOrder.create({
    data: {
      supplierId: artsSupplier.id,
      totalAmount: 925000,
      status: "CONFIRMED",
      orderedAt: new Date("2024-02-01"),
      note: "複数キャリア混在発注、先方受理済み",
      lines: {
        create: [
          { carrierType: "DOCOMO", quantity: 500, unitPrice: 1050, subtotal: 525000 },
          { carrierType: "RAKUTEN", quantity: 500, unitPrice: 800, subtotal: 400000 },
        ],
      },
    },
  });

  // 発注6: ドコモ80枚
  await prisma.purchaseOrder.create({
    data: {
      supplierId: linklifeSupplier.id,
      totalAmount: 80000,
      status: "ORDERED",
      orderedAt: new Date("2024-02-05"),
      note: "通常発注",
      lines: {
        create: [
          { carrierType: "DOCOMO", quantity: 80, unitPrice: 1000, subtotal: 80000 },
        ],
      },
    },
  });

  // 発注7: au120枚
  await prisma.purchaseOrder.create({
    data: {
      supplierId: artsSupplier.id,
      totalAmount: 117600,
      status: "DELIVERED",
      orderedAt: new Date("2024-02-10"),
      invoiceDate: new Date("2024-02-15"),
      deliveryDate: new Date("2024-02-20"),
      note: "au回線、納品完了",
      lines: {
        create: [
          { carrierType: "AU", quantity: 120, unitPrice: 980, subtotal: 117600 },
        ],
      },
    },
  });

  // 発注8: 複数キャリア混在（ソフトバンク300 + au200）
  await prisma.purchaseOrder.create({
    data: {
      supplierId: linklifeSupplier.id,
      totalAmount: 514000,
      status: "AWAITING_DELIVERY",
      orderedAt: new Date("2024-02-15"),
      invoiceDate: new Date("2024-02-18"),
      note: "複数キャリア混在、納品待ち",
      lines: {
        create: [
          { carrierType: "SOFTBANK", quantity: 300, unitPrice: 1080, subtotal: 324000 },
          { carrierType: "AU", quantity: 200, unitPrice: 950, subtotal: 190000 },
        ],
      },
    },
  });

  // 発注9: 楽天40枚
  await prisma.purchaseOrder.create({
    data: {
      supplierId: artsSupplier.id,
      totalAmount: 34000,
      status: "BEFORE_PAYMENT",
      orderedAt: new Date("2024-02-20"),
      invoiceDate: new Date("2024-02-22"),
      note: "楽天回線、振込前",
      lines: {
        create: [
          { carrierType: "RAKUTEN", quantity: 40, unitPrice: 850, subtotal: 34000 },
        ],
      },
    },
  });

  // 発注10: ドコモ90枚
  await prisma.purchaseOrder.create({
    data: {
      supplierId: linklifeSupplier.id,
      totalAmount: 91800,
      status: "DELIVERED",
      orderedAt: new Date("2024-02-25"),
      invoiceDate: new Date("2024-02-28"),
      deliveryDate: new Date("2024-03-05"),
      note: "ドコモ回線、納品完了",
      lines: {
        create: [
          { carrierType: "DOCOMO", quantity: 90, unitPrice: 1020, subtotal: 91800 },
        ],
      },
    },
  });

  console.log("Created 10 purchase orders with multiple carrier lines");

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
