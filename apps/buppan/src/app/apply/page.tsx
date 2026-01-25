"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Label,
  Checkbox,
} from "@repo/ui";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

interface UsageTag {
  id: number;
  name: string;
}

interface PlanUsageTag {
  usageTag: UsageTag;
}

interface PlanPricing {
  id: string;
  customerType: "INDIVIDUAL" | "CORPORATE";
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
  description: string | null;
}

interface Plan {
  id: string;
  code: string;
  name: string;
  usageTags: PlanUsageTag[];
  pricings: PlanPricing[];
}

const steps = [
  { id: 1, name: "プラン選択" },
  { id: 2, name: "お客様情報" },
  { id: 3, name: "回線数・金額" },
  { id: 4, name: "確認・送信" },
];

const prefectures = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

export default function ApplyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォームデータ
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [customerType, setCustomerType] = useState<"INDIVIDUAL" | "CORPORATE">("INDIVIDUAL");
  const [lineCount, setLineCount] = useState(1);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // 顧客情報
  const [customerData, setCustomerData] = useState({
    lastName: "",
    firstName: "",
    lastNameKana: "",
    firstNameKana: "",
    birthDate: "",
    phone: "",
    email: "",
    postalCode: "",
    prefecture: "",
    city: "",
    address: "",
    building: "",
    companyName: "",
    companyNameKana: "",
    companyPostalCode: "",
    companyPrefecture: "",
    companyCity: "",
    companyAddress: "",
    companyBuilding: "",
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/plans");
      const data = await res.json();
      if (res.ok) {
        setPlans(data);
        if (data.length > 0) {
          setSelectedPlanId(data[0].id);
        }
      }
    } catch (err) {
      console.error("プラン取得エラー:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const getUnitPrice = (): number => {
    if (!selectedPlan) return 0;
    const applicablePricings = selectedPlan.pricings
      .filter((p) => p.customerType === customerType)
      .sort((a, b) => a.minQuantity - b.minQuantity);

    if (applicablePricings.length === 0) return 0;

    let unitPrice = applicablePricings[0].unitPrice;
    for (const pricing of applicablePricings) {
      if (lineCount >= pricing.minQuantity) {
        if (!pricing.maxQuantity || lineCount <= pricing.maxQuantity) {
          unitPrice = pricing.unitPrice;
        }
      }
    }
    return unitPrice;
  };

  const unitPrice = getUnitPrice();
  const totalAmount = unitPrice * lineCount;

  const formatPrice = (price: number) => {
    return "¥" + price.toLocaleString();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        planId: selectedPlanId,
        lineCount,
        customer: {
          type: customerType,
          ...customerData,
        },
        agreeTerms,
        agreePrivacy,
      };

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/apply/complete?number=" + data.applicationNumber);
      } else {
        setError(data.error || "申込に失敗しました");
      }
    } catch (err) {
      console.error("申込エラー:", err);
      setError("申込に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedStep2 = (): boolean => {
    if (customerType === "CORPORATE") {
      if (!customerData.companyName || !customerData.companyNameKana) {
        return false;
      }
    }
    return (
      customerData.lastName !== "" &&
      customerData.firstName !== "" &&
      customerData.lastNameKana !== "" &&
      customerData.firstNameKana !== "" &&
      customerData.birthDate !== "" &&
      customerData.phone !== "" &&
      customerData.email !== "" &&
      customerData.postalCode !== "" &&
      customerData.prefecture !== "" &&
      customerData.city !== "" &&
      customerData.address !== ""
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold">お申込み</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={"flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium " +
                    (currentStep > step.id
                      ? "bg-primary text-white"
                      : currentStep === step.id
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-500")}
                >
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={"ml-2 text-sm " +
                    (currentStep >= step.id
                      ? "text-gray-900"
                      : "text-gray-500")}
                >
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={"w-12 h-0.5 mx-4 " +
                      (currentStep > step.id ? "bg-primary" : "bg-gray-200")}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>プランを選択してください</CardTitle>
              <CardDescription>
                ご利用用途に合わせてプランをお選びください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingPlans ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  現在お申込み可能なプランがありません
                </div>
              ) : (
                <div className="grid gap-4">
                  {plans.map((plan) => {
                    const individualPrice = plan.pricings.find(
                      (p) => p.customerType === "INDIVIDUAL" && p.minQuantity === 1
                    );
                    return (
                      <label
                        key={plan.id}
                        className={"flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 " +
                          (selectedPlanId === plan.id ? "border-primary bg-primary/5" : "")}
                      >
                        <input
                          type="radio"
                          name="plan"
                          value={plan.id}
                          checked={selectedPlanId === plan.id}
                          onChange={() => setSelectedPlanId(plan.id)}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {plan.usageTags.map((pt) => pt.usageTag.name).join(", ") || "汎用プラン"}
                            {individualPrice && " - " + formatPrice(individualPrice.unitPrice) + "/月"}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-end pt-4">
                <Button onClick={() => setCurrentStep(2)} disabled={!selectedPlanId}>
                  次へ
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>お客様情報</CardTitle>
              <CardDescription>
                ご契約者様の情報をご入力ください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="customerType"
                    value="INDIVIDUAL"
                    checked={customerType === "INDIVIDUAL"}
                    onChange={() => setCustomerType("INDIVIDUAL")}
                  />
                  個人のお客様
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="customerType"
                    value="CORPORATE"
                    checked={customerType === "CORPORATE"}
                    onChange={() => setCustomerType("CORPORATE")}
                  />
                  法人のお客様
                </label>
              </div>

              {customerType === "CORPORATE" && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">法人情報</h4>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="companyName">法人名 *</Label>
                        <Input
                          id="companyName"
                          placeholder="株式会社〇〇"
                          value={customerData.companyName}
                          onChange={(e) => setCustomerData({ ...customerData, companyName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="companyNameKana">法人名（カナ）*</Label>
                        <Input
                          id="companyNameKana"
                          placeholder="カブシキガイシャ〇〇"
                          value={customerData.companyNameKana}
                          onChange={(e) => setCustomerData({ ...customerData, companyNameKana: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-medium">
                  {customerType === "CORPORATE" ? "担当者情報" : "ご契約者情報"}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lastName">姓 *</Label>
                    <Input
                      id="lastName"
                      placeholder="山田"
                      value={customerData.lastName}
                      onChange={(e) => setCustomerData({ ...customerData, lastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstName">名 *</Label>
                    <Input
                      id="firstName"
                      placeholder="太郎"
                      value={customerData.firstName}
                      onChange={(e) => setCustomerData({ ...customerData, firstName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lastNameKana">セイ *</Label>
                    <Input
                      id="lastNameKana"
                      placeholder="ヤマダ"
                      value={customerData.lastNameKana}
                      onChange={(e) => setCustomerData({ ...customerData, lastNameKana: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstNameKana">メイ *</Label>
                    <Input
                      id="firstNameKana"
                      placeholder="タロウ"
                      value={customerData.firstNameKana}
                      onChange={(e) => setCustomerData({ ...customerData, firstNameKana: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="birthDate">生年月日 *</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={customerData.birthDate}
                      onChange={(e) => setCustomerData({ ...customerData, birthDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">電話番号 *</Label>
                    <Input
                      id="phone"
                      placeholder="09012345678"
                      value={customerData.phone}
                      onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">メールアドレス *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">ご住所</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="postalCode">郵便番号 *</Label>
                    <Input
                      id="postalCode"
                      placeholder="123-4567"
                      value={customerData.postalCode}
                      onChange={(e) => setCustomerData({ ...customerData, postalCode: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="prefecture">都道府県 *</Label>
                    <select
                      id="prefecture"
                      className="w-full h-10 px-3 border rounded-md"
                      value={customerData.prefecture}
                      onChange={(e) => setCustomerData({ ...customerData, prefecture: e.target.value })}
                    >
                      <option value="">選択してください</option>
                      {prefectures.map((pref) => (
                        <option key={pref} value={pref}>{pref}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="city">市区町村 *</Label>
                  <Input
                    id="city"
                    placeholder="渋谷区"
                    value={customerData.city}
                    onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="address">番地 *</Label>
                  <Input
                    id="address"
                    placeholder="1-2-3"
                    value={customerData.address}
                    onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="building">建物名・部屋番号（任意）</Label>
                  <Input
                    id="building"
                    placeholder="〇〇マンション101"
                    value={customerData.building}
                    onChange={(e) => setCustomerData({ ...customerData, building: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
                <Button onClick={() => setCurrentStep(3)} disabled={!canProceedStep2()}>
                  次へ
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>回線数と金額</CardTitle>
              <CardDescription>
                必要な回線数をご入力ください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="lineCount">回線数</Label>
                <Input
                  id="lineCount"
                  type="number"
                  min="1"
                  value={lineCount}
                  onChange={(e) => setLineCount(parseInt(e.target.value) || 1)}
                  className="w-32"
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>{selectedPlan?.name} × {lineCount}回線</span>
                  <span>{formatPrice(unitPrice)} × {lineCount}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>月額合計（税込）</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
                <Button onClick={() => setCurrentStep(4)}>
                  次へ
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>お申込み内容の確認</CardTitle>
              <CardDescription>
                内容をご確認の上、送信してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">プラン</h4>
                  <p>{selectedPlan?.name} - {lineCount}回線</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">
                    {customerType === "CORPORATE" ? "法人情報" : "ご契約者情報"}
                  </h4>
                  {customerType === "CORPORATE" && (
                    <p className="mb-1">{customerData.companyName}</p>
                  )}
                  <p>
                    {customerData.lastName} {customerData.firstName}（{customerData.lastNameKana} {customerData.firstNameKana}）
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customerData.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    〒{customerData.postalCode} {customerData.prefecture}{customerData.city}{customerData.address}
                    {customerData.building && " " + customerData.building}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">月額料金</h4>
                  <p className="text-xl font-bold">{formatPrice(totalAmount)}（税込）</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                  />
                  <span className="text-sm">
                    <a href="#" className="text-primary underline">
                      利用規約
                    </a>
                    に同意します
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <Checkbox
                    id="privacy"
                    checked={agreePrivacy}
                    onCheckedChange={(checked) => setAgreePrivacy(checked === true)}
                  />
                  <span className="text-sm">
                    <a href="#" className="text-primary underline">
                      プライバシーポリシー
                    </a>
                    に同意します
                  </span>
                </label>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!agreeTerms || !agreePrivacy || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      送信中...
                    </>
                  ) : (
                    "申込みを送信"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
