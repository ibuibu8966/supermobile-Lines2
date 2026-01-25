import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { z } from "zod";

export const dynamic = "force-dynamic";

// 個人情報スキーマ
const individualInfoSchema = z.object({
  type: z.literal("INDIVIDUAL"),
  lastName: z.string().min(1, "姓を入力してください").max(50),
  firstName: z.string().min(1, "名を入力してください").max(50),
  lastNameKana: z.string().min(1, "セイを入力してください").regex(/^[ァ-ヶー]+$/, "カタカナで入力してください"),
  firstNameKana: z.string().min(1, "メイを入力してください").regex(/^[ァ-ヶー]+$/, "カタカナで入力してください"),
  birthDate: z.string().min(1, "生年月日を入力してください"),
  phone: z.string().regex(/^0\d{9,10}$/, "電話番号の形式が正しくありません"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  postalCode: z.string().regex(/^\d{3}-?\d{4}$/, "郵便番号の形式が正しくありません"),
  prefecture: z.string().min(1, "都道府県を選択してください"),
  city: z.string().min(1, "市区町村を入力してください"),
  address: z.string().min(1, "番地を入力してください"),
  building: z.string().optional(),
});

// 法人情報スキーマ
const corporateInfoSchema = z.object({
  type: z.literal("CORPORATE"),
  companyName: z.string().min(1, "法人名を入力してください").max(100),
  companyNameKana: z.string().min(1, "法人名（カナ）を入力してください").regex(/^[ァ-ヶー\s]+$/, "カタカナで入力してください"),
  lastName: z.string().min(1, "姓を入力してください").max(50),
  firstName: z.string().min(1, "名を入力してください").max(50),
  lastNameKana: z.string().min(1, "セイを入力してください").regex(/^[ァ-ヶー]+$/, "カタカナで入力してください"),
  firstNameKana: z.string().min(1, "メイを入力してください").regex(/^[ァ-ヶー]+$/, "カタカナで入力してください"),
  birthDate: z.string().min(1, "生年月日を入力してください"),
  phone: z.string().regex(/^0\d{9,10}$/, "電話番号の形式が正しくありません"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  postalCode: z.string().regex(/^\d{3}-?\d{4}$/, "郵便番号の形式が正しくありません"),
  prefecture: z.string().min(1, "都道府県を選択してください"),
  city: z.string().min(1, "市区町村を入力してください"),
  address: z.string().min(1, "番地を入力してください"),
  building: z.string().optional(),
  companyPostalCode: z.string().regex(/^\d{3}-?\d{4}$/, "郵便番号の形式が正しくありません").optional(),
  companyPrefecture: z.string().optional(),
  companyCity: z.string().optional(),
  companyAddress: z.string().optional(),
  companyBuilding: z.string().optional(),
});

// 申込スキーマ
const applicationSchema = z.object({
  planId: z.string().cuid("プランを選択してください"),
  lineCount: z.number().int().min(1, "1回線以上を入力してください").max(1000),
  customer: z.discriminatedUnion("type", [individualInfoSchema, corporateInfoSchema]),
  agreeTerms: z.boolean().refine((v) => v === true, "利用規約に同意してください"),
  agreePrivacy: z.boolean().refine((v) => v === true, "プライバシーポリシーに同意してください"),
});

// 申込番号を生成
function generateApplicationNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `BP${year}${month}${day}${random}`;
}

// 申込作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = applicationSchema.parse(body);

    // 物販サービスを取得
    const service = await prisma.service.findUnique({
      where: { code: "buppan" },
    });

    if (!service) {
      return NextResponse.json(
        { error: "サービスが見つかりません" },
        { status: 404 }
      );
    }

    // プランと料金を取得
    const plan = await prisma.plan.findUnique({
      where: { id: validated.planId },
      include: {
        pricings: true,
      },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: "プランが見つかりません" },
        { status: 404 }
      );
    }

    // 顧客種別に応じた料金を取得
    const customerType = validated.customer.type;
    const applicablePricings = plan.pricings
      .filter((p) => p.customerType === customerType)
      .sort((a, b) => a.minQuantity - b.minQuantity);

    if (applicablePricings.length === 0) {
      return NextResponse.json(
        { error: "該当する料金プランが見つかりません" },
        { status: 400 }
      );
    }

    // 回線数に応じた単価を計算
    let unitPrice = applicablePricings[0].unitPrice;
    for (const pricing of applicablePricings) {
      if (validated.lineCount >= pricing.minQuantity) {
        if (!pricing.maxQuantity || validated.lineCount <= pricing.maxQuantity) {
          unitPrice = pricing.unitPrice;
        }
      }
    }

    const totalAmount = unitPrice * validated.lineCount;

    // トランザクションで顧客と申込を作成
    const result = await prisma.$transaction(async (tx) => {
      // 既存顧客を検索（メールアドレスで）
      let customer = await tx.customer.findUnique({
        where: { email: validated.customer.email },
      });

      // 顧客が存在しない場合は作成
      if (!customer) {
        const customerData = validated.customer;
        customer = await tx.customer.create({
          data: {
            type: customerType,
            email: customerData.email,
            phone: customerData.phone,
            lastName: customerData.lastName,
            firstName: customerData.firstName,
            lastNameKana: customerData.lastNameKana,
            firstNameKana: customerData.firstNameKana,
            birthDate: new Date(customerData.birthDate),
            postalCode: customerData.postalCode.replace("-", ""),
            prefecture: customerData.prefecture,
            city: customerData.city,
            address: customerData.address,
            building: customerData.building || null,
            companyName: customerType === "CORPORATE" ? (customerData as z.infer<typeof corporateInfoSchema>).companyName : null,
            companyNameKana: customerType === "CORPORATE" ? (customerData as z.infer<typeof corporateInfoSchema>).companyNameKana : null,
            companyPostalCode: customerType === "CORPORATE" ? (customerData as z.infer<typeof corporateInfoSchema>).companyPostalCode?.replace("-", "") : null,
            companyPrefecture: customerType === "CORPORATE" ? (customerData as z.infer<typeof corporateInfoSchema>).companyPrefecture : null,
            companyCity: customerType === "CORPORATE" ? (customerData as z.infer<typeof corporateInfoSchema>).companyCity : null,
            companyAddress: customerType === "CORPORATE" ? (customerData as z.infer<typeof corporateInfoSchema>).companyAddress : null,
            companyBuilding: customerType === "CORPORATE" ? (customerData as z.infer<typeof corporateInfoSchema>).companyBuilding : null,
          },
        });
      }

      // 申込番号を生成（重複チェック付き）
      let applicationNumber: string;
      let attempts = 0;
      do {
        applicationNumber = generateApplicationNumber();
        const existing = await tx.application.findUnique({
          where: { applicationNumber },
        });
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        throw new Error("申込番号の生成に失敗しました");
      }

      // 申込を作成
      const application = await tx.application.create({
        data: {
          applicationNumber,
          customerId: customer.id,
          serviceId: service.id,
          planId: plan.id,
          lineCount: validated.lineCount,
          unitPrice,
          totalAmount,
          status: "SUBMITTED",
        },
        include: {
          customer: true,
          plan: true,
        },
      });

      // 申込回線を作成
      const linesData = Array.from({ length: validated.lineCount }, (_, i) => ({
        applicationId: application.id,
        lineNumber: i + 1,
        status: "UNASSIGNED" as const,
      }));

      await tx.applicationLine.createMany({
        data: linesData,
      });

      return application;
    });

    return NextResponse.json({
      success: true,
      applicationNumber: result.applicationNumber,
      application: result,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("申込作成エラー:", error);
    return NextResponse.json(
      { error: "申込の作成に失敗しました" },
      { status: 500 }
    );
  }
}
