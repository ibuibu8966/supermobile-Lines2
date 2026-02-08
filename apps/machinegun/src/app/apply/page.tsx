"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@repo/ui";
import { ArrowLeft, ArrowRight, Check, Loader2, Upload, X, Eye, EyeOff, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface UsageTag {
  id: number;
  name: string;
}

interface PlanUsageTag {
  usageTag: UsageTag;
}

interface PlanPricing {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
  description: string | null;
}

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  usageTags: PlanUsageTag[];
  pricings: PlanPricing[];
}

const steps = [
  { id: 1, name: "プラン選択" },
  { id: 2, name: "お客様情報" },
  { id: 3, name: "本人確認" },
  { id: 4, name: "回線数・金額" },
  { id: 5, name: "確認・送信" },
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

// ファイルアップロードコンポーネント
function FileUpload({
  label,
  file,
  onFileChange,
  accept = "image/*",
  required = false,
}: {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [file]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  const handleRemove = () => {
    onFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      {file && preview ? (
        <div className="relative border rounded-lg p-2 bg-gray-50">
          <div className="flex items-center gap-3">
            {file.type.startsWith("image/") ? (
              <Image
                src={preview}
                alt="プレビュー"
                width={80}
                height={80}
                className="object-cover rounded"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                PDF
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary hover:bg-gray-50 transition-colors"
        >
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Upload className="h-8 w-8" />
            <span className="text-sm">クリックしてファイルを選択</span>
            <span className="text-xs">
              {accept.includes("pdf") ? "画像またはPDF" : "画像ファイル"}（最大10MB）
            </span>
          </div>
        </button>
      )}
    </div>
  );
}

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
  const [lineCount, setLineCount] = useState(10);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeTelecom, setAgreeTelecom] = useState(false);
  const [agreeInitialCancellation, setAgreeInitialCancellation] = useState(false);
  const [agreeAntiSocial, setAgreeAntiSocial] = useState(false);

  // パスワード
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // KYC書類
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [corporateRegistry, setCorporateRegistry] = useState<File | null>(null);
  const [idExpiryDate, setIdExpiryDate] = useState("");

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
      const formData = new FormData();
      formData.append("planId", selectedPlanId);
      formData.append("lineCount", lineCount.toString());
      formData.append("customerType", customerType);
      formData.append("password", password);
      formData.append("customer", JSON.stringify(customerData));
      formData.append("agreeTerms", agreeTerms.toString());
      formData.append("agreePrivacy", agreePrivacy.toString());
      formData.append("agreeTelecom", agreeTelecom.toString());
      formData.append("agreeInitialCancellation", agreeInitialCancellation.toString());
      formData.append("agreeAntiSocial", agreeAntiSocial.toString());

      // KYC書類
      if (idFront) formData.append("idFront", idFront);
      if (idBack) formData.append("idBack", idBack);
      if (corporateRegistry) formData.append("corporateRegistry", corporateRegistry);
      if (idExpiryDate) formData.append("idExpiryDate", idExpiryDate);

      const res = await fetch("/api/applications", {
        method: "POST",
        body: formData,
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
    // パスワードチェック
    if (password.length < 8) return false;
    if (password !== passwordConfirm) return false;

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

  const canProceedStep3 = (): boolean => {
    // KYC書類チェック
    if (!idExpiryDate) return false;
    if (customerType === "INDIVIDUAL") {
      return idFront !== null && idBack !== null;
    } else {
      return idFront !== null && idBack !== null && corporateRegistry !== null;
    }
  };

  const getPasswordError = (): string | null => {
    if (password && password.length < 8) {
      return "パスワードは8文字以上で入力してください";
    }
    if (passwordConfirm && password !== passwordConfirm) {
      return "パスワードが一致しません";
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
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
                  className={"ml-2 text-sm hidden sm:inline " +
                    (currentStep >= step.id
                      ? "text-gray-900"
                      : "text-gray-500")}
                >
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={"w-8 sm:w-12 h-0.5 mx-2 sm:mx-4 " +
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
                    const sortedPricings = [...plan.pricings].sort((a, b) => a.minQuantity - b.minQuantity);
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
                        <div className="flex-1">
                          <p className="font-medium">{plan.name}</p>
                          {plan.description && (
                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                              {plan.description}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1 mb-2">
                            {plan.usageTags.map((pt) => pt.usageTag.name).join(", ") || "汎用プラン"}
                          </p>
                          <div className="space-y-0.5">
                            {sortedPricings.map((pricing, i) => {
                              const rangeText = pricing.maxQuantity
                                ? `${pricing.minQuantity}〜${pricing.maxQuantity}回線`
                                : `${pricing.minQuantity}回線以上`;
                              return (
                                <div key={i} className="text-xs text-gray-500">
                                  {rangeText}: <span className="font-medium">{formatPrice(pricing.unitPrice)}</span>/回線
                                </div>
                              );
                            })}
                          </div>
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
                    <Label>生年月日 *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !customerData.birthDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {customerData.birthDate
                            ? format(new Date(customerData.birthDate), "yyyy年MM月dd日", { locale: ja })
                            : "生年月日を選択"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customerData.birthDate ? new Date(customerData.birthDate) : undefined}
                          onSelect={(date) =>
                            setCustomerData({
                              ...customerData,
                              birthDate: date ? format(date, "yyyy-MM-dd") : "",
                            })
                          }
                          defaultMonth={customerData.birthDate ? new Date(customerData.birthDate) : new Date(1990, 0)}
                          startMonth={new Date(1920, 0)}
                          endMonth={new Date()}
                          captionLayout="dropdown"
                          locale={ja}
                        />
                      </PopoverContent>
                    </Popover>
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

              <div className="space-y-4">
                <h4 className="font-medium">マイページ用パスワード</h4>
                <p className="text-sm text-muted-foreground">
                  お申込み完了後、マイページにログインするためのパスワードを設定してください
                </p>
                <div>
                  <Label htmlFor="password">パスワード *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="8文字以上"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="passwordConfirm">パスワード（確認）*</Label>
                  <div className="relative">
                    <Input
                      id="passwordConfirm"
                      type={showPasswordConfirm ? "text" : "password"}
                      placeholder="パスワードを再入力"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {getPasswordError() && (
                  <p className="text-sm text-red-500">{getPasswordError()}</p>
                )}
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
              <CardTitle>本人確認書類</CardTitle>
              <CardDescription>
                {customerType === "INDIVIDUAL"
                  ? "運転免許証の表面・裏面をアップロードしてください"
                  : "登記簿謄本と代表者の身分証明書をアップロードしてください"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {customerType === "INDIVIDUAL" ? (
                <div className="space-y-4">
                  <h4 className="font-medium">運転免許証</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FileUpload
                      label="免許証（表面）"
                      file={idFront}
                      onFileChange={setIdFront}
                      required
                    />
                    <FileUpload
                      label="免許証（裏面）"
                      file={idBack}
                      onFileChange={setIdBack}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">法人確認書類</h4>
                    <FileUpload
                      label="登記簿謄本（履歴事項全部証明書）"
                      file={corporateRegistry}
                      onFileChange={setCorporateRegistry}
                      accept="image/*,.pdf"
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      発行から3ヶ月以内のものをご用意ください
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">代表者身分証明書</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FileUpload
                        label="身分証明書（表面）"
                        file={idFront}
                        onFileChange={setIdFront}
                        required
                      />
                      <FileUpload
                        label="身分証明書（裏面）"
                        file={idBack}
                        onFileChange={setIdBack}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-medium">身分証明書の有効期限</h4>
                <div className="max-w-xs">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !idExpiryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {idExpiryDate
                          ? format(new Date(idExpiryDate), "yyyy年MM月dd日", { locale: ja })
                          : "有効期限を選択"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={idExpiryDate ? new Date(idExpiryDate) : undefined}
                        onSelect={(date) =>
                          setIdExpiryDate(date ? format(date, "yyyy-MM-dd") : "")
                        }
                        startMonth={new Date()}
                        endMonth={new Date(new Date().getFullYear() + 15, 11)}
                        captionLayout="dropdown"
                        locale={ja}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-sm text-muted-foreground mt-1">
                    運転免許証等の有効期限を入力してください
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
                <Button onClick={() => setCurrentStep(4)} disabled={!canProceedStep3()}>
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
              <CardTitle>回線数と金額</CardTitle>
              <CardDescription>
                必要な回線数をご入力ください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 料金テーブル */}
              {selectedPlan && selectedPlan.pricings.length > 1 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                  <h4 className="font-medium text-blue-900 mb-2">回線数別料金（まとめてお得！）</h4>
                  <div className="space-y-1">
                    {[...selectedPlan.pricings]
                      .sort((a, b) => a.minQuantity - b.minQuantity)
                      .map((pricing, i) => {
                        const isCurrentTier = lineCount >= pricing.minQuantity &&
                          (!pricing.maxQuantity || lineCount <= pricing.maxQuantity);
                        const rangeText = pricing.maxQuantity
                          ? `${pricing.minQuantity}〜${pricing.maxQuantity}回線`
                          : `${pricing.minQuantity}回線以上`;
                        return (
                          <div
                            key={i}
                            className={`flex justify-between text-sm py-1 px-2 rounded ${
                              isCurrentTier ? "bg-blue-100 font-medium text-blue-900" : ""
                            }`}
                          >
                            <span>{rangeText}</span>
                            <span>{formatPrice(pricing.unitPrice)}/回線</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="lineCount">回線数</Label>
                <Input
                  id="lineCount"
                  type="number"
                  min="10"
                  step="10"
                  value={lineCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 10;
                    setLineCount(Math.max(10, Math.round(val / 10) * 10));
                  }}
                  className="w-32"
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-gray-900">
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
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
                <Button onClick={() => setCurrentStep(5)}>
                  次へ
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>申し込み内容の確認</CardTitle>
              <CardDescription>
                内容をご確認の上、お申込みください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 個人情報 */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gold">個人情報</h4>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-sm text-gold hover:underline"
                    >
                      修正する
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  <div className="flex px-4 py-3">
                    <span className="w-36 text-sm text-muted-foreground shrink-0">氏名</span>
                    <span className="text-sm">
                      {customerData.lastName} {customerData.firstName}
                      {" "}({customerData.lastNameKana} {customerData.firstNameKana})
                    </span>
                  </div>
                  <div className="flex px-4 py-3">
                    <span className="w-36 text-sm text-muted-foreground shrink-0">生年月日</span>
                    <span className="text-sm">{customerData.birthDate}</span>
                  </div>
                  <div className="flex px-4 py-3">
                    <span className="w-36 text-sm text-muted-foreground shrink-0">電話番号</span>
                    <span className="text-sm">{customerData.phone}</span>
                  </div>
                  <div className="flex px-4 py-3">
                    <span className="w-36 text-sm text-muted-foreground shrink-0">メールアドレス</span>
                    <span className="text-sm">{customerData.email}</span>
                  </div>
                  <div className="flex px-4 py-3">
                    <span className="w-36 text-sm text-muted-foreground shrink-0">住所</span>
                    <span className="text-sm">
                      〒{customerData.postalCode} {customerData.prefecture}
                      {customerData.city}{customerData.address}
                      {customerData.building && ` ${customerData.building}`}
                    </span>
                  </div>
                  <div className="flex px-4 py-3">
                    <span className="w-36 text-sm text-muted-foreground shrink-0">身分証有効期限</span>
                    <span className="text-sm">{idExpiryDate}</span>
                  </div>
                </div>
              </div>

              {/* プラン情報 */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gold">プラン情報</h4>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="text-sm text-gold hover:underline"
                    >
                      修正する
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  <div className="flex px-4 py-3">
                    <span className="w-36 text-sm text-muted-foreground shrink-0">プラン</span>
                    <span className="text-sm">{selectedPlan?.name}</span>
                  </div>
                  <div className="flex px-4 py-3">
                    <span className="w-36 text-sm text-muted-foreground shrink-0">回線数</span>
                    <span className="text-sm">{lineCount}回線</span>
                  </div>
                  <div className="flex px-4 py-3">
                    <span className="w-36 text-sm text-muted-foreground shrink-0 font-bold">合計金額</span>
                    <span className="text-lg font-bold">{formatPrice(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* アップロード書類 */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gold">アップロード書類</h4>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-sm text-gold hover:underline"
                    >
                      修正する
                    </button>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-1">
                  {customerType === "CORPORATE" && corporateRegistry && (
                    <p className="text-sm">・登記簿謄本: {corporateRegistry.name}</p>
                  )}
                  {idFront && <p className="text-sm">・身分証明書（表）: {idFront.name}</p>}
                  {idBack && <p className="text-sm">・身分証明書（裏）: {idBack.name}</p>}
                </div>
              </div>

              {/* チェック項目 */}
              <div className="space-y-4 pt-2">
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={agreePrivacy}
                    onCheckedChange={(checked) => setAgreePrivacy(checked === true)}
                  />
                  <span className="text-sm">
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-gold underline">
                      プライバシーポリシー
                    </a>
                    に同意します
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                  />
                  <span className="text-sm">
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-gold underline">
                      利用規約
                    </a>
                    に同意します
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={agreeTelecom}
                    onCheckedChange={(checked) => setAgreeTelecom(checked === true)}
                  />
                  <span className="text-sm">
                    <a href="/legal#telecom-law" target="_blank" rel="noopener noreferrer" className="text-gold underline">
                      電気通信事業法約款
                    </a>
                    に同意します
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={agreeInitialCancellation}
                    onCheckedChange={(checked) => setAgreeInitialCancellation(checked === true)}
                  />
                  <span className="text-sm">初期契約解除制度を確認しました</span>
                </label>
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={agreeAntiSocial}
                    onCheckedChange={(checked) => setAgreeAntiSocial(checked === true)}
                  />
                  <span className="text-sm">反社会的勢力ではないことを表明し確約します</span>
                </label>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(4)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!agreeTerms || !agreePrivacy || !agreeTelecom || !agreeInitialCancellation || !agreeAntiSocial || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      送信中...
                    </>
                  ) : (
                    "申し込む"
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
