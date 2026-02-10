import { NextRequest, NextResponse } from "next/server";
import { prisma, uploadFile } from "@repo/database";
import { hashPassword } from "@repo/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

// 顧客情報スキーマ
const customerInfoSchema = z.object({
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
  companyName: z.string().optional(),
  companyNameKana: z.string().optional(),
  companyPostalCode: z.string().optional(),
  companyPrefecture: z.string().optional(),
  companyCity: z.string().optional(),
  companyAddress: z.string().optional(),
  companyBuilding: z.string().optional(),
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

// ファイルをBufferに変換
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 申込作成
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // フォームデータを取得
    const planId = formData.get("planId") as string;
    const lineCount = parseInt(formData.get("lineCount") as string, 10);
    const customerType = formData.get("customerType") as "INDIVIDUAL" | "CORPORATE";
    const password = formData.get("password") as string;
    const customerJson = formData.get("customer") as string;
    const agreeTerms = formData.get("agreeTerms") === "true";
    const agreePrivacy = formData.get("agreePrivacy") === "true";
    const agreeTelecom = formData.get("agreeTelecom") === "true";
    const agreeInitialCancellation = formData.get("agreeInitialCancellation") === "true";
    const agreeAntiSocial = formData.get("agreeAntiSocial") === "true";

    // KYCファイル
    const idFront = formData.get("idFront") as File | null;
    const idBack = formData.get("idBack") as File | null;
    const corporateRegistry = formData.get("corporateRegistry") as File | null;
    const idExpiryDateStr = formData.get("idExpiryDate") as string | null;
    const idExpiryDate = idExpiryDateStr ? new Date(idExpiryDateStr) : null;
    const couponCode = formData.get("couponCode") as string | null;

    // バリデーション
    if (!planId || !lineCount || !customerType || !password || !customerJson) {
      return NextResponse.json(
        { error: "必須項目が入力されていません" },
        { status: 400 }
      );
    }

    if (lineCount < 10 || lineCount % 10 !== 0) {
      return NextResponse.json(
        { error: "回線数は10回線単位で指定してください" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "パスワードは8文字以上で入力してください" },
        { status: 400 }
      );
    }

    if (!agreeTerms || !agreePrivacy || !agreeTelecom || !agreeInitialCancellation || !agreeAntiSocial) {
      return NextResponse.json(
        { error: "すべての同意事項にチェックしてください" },
        { status: 400 }
      );
    }

    // KYC書類チェック
    if (!idFront || !idBack) {
      return NextResponse.json(
        { error: "本人確認書類をアップロードしてください" },
        { status: 400 }
      );
    }

    if (customerType === "CORPORATE" && !corporateRegistry) {
      return NextResponse.json(
        { error: "登記簿謄本をアップロードしてください" },
        { status: 400 }
      );
    }

    // 顧客情報パース
    let customerData;
    try {
      customerData = customerInfoSchema.parse(JSON.parse(customerJson));
    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json(
          { error: e.issues.map((i) => i.message).join(", ") },
          { status: 400 }
        );
      }
      throw e;
    }

    // 法人の場合の追加バリデーション
    if (customerType === "CORPORATE") {
      if (!customerData.companyName || !customerData.companyNameKana) {
        return NextResponse.json(
          { error: "法人名を入力してください" },
          { status: 400 }
        );
      }
    }

    // versusサービスを取得
    const service = await prisma.service.findUnique({
      where: { code: "versus" },
    });

    if (!service) {
      return NextResponse.json(
        { error: "サービスが見つかりません" },
        { status: 404 }
      );
    }

    // プランと料金を取得
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
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

    // 回線数に応じた料金を取得
    const applicablePricings = plan.pricings
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
      if (lineCount >= pricing.minQuantity) {
        if (!pricing.maxQuantity || lineCount <= pricing.maxQuantity) {
          unitPrice = pricing.unitPrice;
        }
      }
    }

    // クーポン処理
    let couponId: string | null = null;
    let appliedCouponCode: string | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: couponCode, isActive: true },
      });
      if (coupon) {
        const now = new Date();
        if (
          coupon.planId === planId &&
          now >= coupon.validFrom &&
          now <= coupon.validUntil &&
          (coupon.maxUsages === null || coupon.usageCount < coupon.maxUsages)
        ) {
          unitPrice = coupon.unitPrice;
          couponId = coupon.id;
          appliedCouponCode = coupon.code;
        }
      }
    }

    const totalAmount = unitPrice * lineCount;

    // メールアドレスの重複チェック（ユーザー）
    const existingUser = await prisma.user.findUnique({
      where: { email: customerData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 400 }
      );
    }

    // パスワードハッシュ化
    const hashedPassword = await hashPassword(password);

    // トランザクションで顧客、ユーザー、申込を作成
    const result = await prisma.$transaction(async (tx) => {
      // ユーザーを作成
      const user = await tx.user.create({
        data: {
          email: customerData.email,
          password: hashedPassword,
          role: "CUSTOMER",
          serviceId: service.id,
          isActive: true,
        },
      });

      // 顧客を作成
      const customer = await tx.customer.create({
        data: {
          userId: user.id,
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
          companyName: customerType === "CORPORATE" ? customerData.companyName : null,
          companyNameKana: customerType === "CORPORATE" ? customerData.companyNameKana : null,
          companyPostalCode: customerType === "CORPORATE" ? customerData.companyPostalCode?.replace("-", "") : null,
          companyPrefecture: customerType === "CORPORATE" ? customerData.companyPrefecture : null,
          companyCity: customerType === "CORPORATE" ? customerData.companyCity : null,
          companyAddress: customerType === "CORPORATE" ? customerData.companyAddress : null,
          companyBuilding: customerType === "CORPORATE" ? customerData.companyBuilding : null,
        },
      });

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
          lineCount,
          unitPrice,
          totalAmount,
          couponId,
          couponCode: appliedCouponCode,
          status: "SUBMITTED",
        },
        include: {
          customer: true,
          plan: true,
        },
      });

      // 申込回線を作成
      const linesData = Array.from({ length: lineCount }, (_, i) => ({
        applicationId: application.id,
        lineNumber: i + 1,
        status: "NOT_ACTIVATED" as const,
      }));

      await tx.applicationLine.createMany({
        data: linesData,
      });

      // クーポン利用回数を更新
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      return { application, applicationNumber };
    });

    // KYC書類をアップロード（トランザクション外）
    const applicationId = result.application.id;
    const timestamp = Date.now();

    // ID表面
    const idFrontPath = `kyc/${applicationId}/id_front_${timestamp}`;
    const idFrontBuffer = await fileToBuffer(idFront);
    await uploadFile("kyc", idFrontPath, idFrontBuffer, idFront.type);
    await prisma.kycImage.create({
      data: {
        applicationId,
        type: "ID_FRONT",
        storagePath: idFrontPath,
        status: "PENDING",
        expiryDate: idExpiryDate,
      },
    });

    // ID裏面
    const idBackPath = `kyc/${applicationId}/id_back_${timestamp}`;
    const idBackBuffer = await fileToBuffer(idBack);
    await uploadFile("kyc", idBackPath, idBackBuffer, idBack.type);
    await prisma.kycImage.create({
      data: {
        applicationId,
        type: "ID_BACK",
        storagePath: idBackPath,
        status: "PENDING",
        expiryDate: idExpiryDate,
      },
    });

    // 登記簿謄本（法人のみ）
    if (corporateRegistry) {
      const corpPath = `kyc/${applicationId}/corporate_registry_${timestamp}`;
      const corpBuffer = await fileToBuffer(corporateRegistry);
      await uploadFile("kyc", corpPath, corpBuffer, corporateRegistry.type);
      await prisma.kycImage.create({
        data: {
          applicationId,
          type: "CORPORATE_REGISTRY",
          storagePath: corpPath,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({
      success: true,
      applicationNumber: result.applicationNumber,
      application: result.application,
    }, { status: 201 });
  } catch (error) {
    console.error("申込作成エラー:", error);
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { error: "申込の作成に失敗しました", details: errorMessage },
      { status: 500 }
    );
  }
}
