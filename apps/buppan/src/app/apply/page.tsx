"use client";

import { useState } from "react";
import Link from "next/link";
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
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const steps = [
  { id: 1, name: "プラン選択" },
  { id: 2, name: "お客様情報" },
  { id: 3, name: "回線数・金額" },
  { id: 4, name: "確認・送信" },
];

export default function ApplyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [customerType, setCustomerType] = useState<"individual" | "corporate">(
    "individual"
  );

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
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    currentStep > step.id
                      ? "bg-primary text-white"
                      : currentStep === step.id
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    currentStep >= step.id
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-4 ${
                      currentStep > step.id ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>プランを選択してください</CardTitle>
              <CardDescription>
                ご利用用途に合わせてプランをお選びください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <label className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="plan"
                    value="adaafi"
                    defaultChecked
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">アダアフィプラン</p>
                    <p className="text-sm text-muted-foreground">
                      アダルトアフィリエイト認証対応 - ¥3,980/月
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="plan"
                    value="pokeka"
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">ポケカプラン</p>
                    <p className="text-sm text-muted-foreground">
                      ポケカ認証対応 - ¥2,980/月
                    </p>
                  </div>
                </label>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => setCurrentStep(2)}>
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
                    value="individual"
                    checked={customerType === "individual"}
                    onChange={() => setCustomerType("individual")}
                  />
                  個人のお客様
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="customerType"
                    value="corporate"
                    checked={customerType === "corporate"}
                    onChange={() => setCustomerType("corporate")}
                  />
                  法人のお客様
                </label>
              </div>

              {customerType === "corporate" && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">法人情報</h4>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="companyName">法人名</Label>
                        <Input id="companyName" placeholder="株式会社〇〇" />
                      </div>
                      <div>
                        <Label htmlFor="companyNameKana">法人名（カナ）</Label>
                        <Input id="companyNameKana" placeholder="カブシキガイシャ〇〇" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-medium">
                  {customerType === "corporate" ? "担当者情報" : "ご契約者情報"}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lastName">姓</Label>
                    <Input id="lastName" placeholder="山田" />
                  </div>
                  <div>
                    <Label htmlFor="firstName">名</Label>
                    <Input id="firstName" placeholder="太郎" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lastNameKana">セイ</Label>
                    <Input id="lastNameKana" placeholder="ヤマダ" />
                  </div>
                  <div>
                    <Label htmlFor="firstNameKana">メイ</Label>
                    <Input id="firstNameKana" placeholder="タロウ" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="birthDate">生年月日</Label>
                    <Input id="birthDate" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="phone">電話番号</Label>
                    <Input id="phone" placeholder="09012345678" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input id="email" type="email" placeholder="example@email.com" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">ご住所</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="postalCode">郵便番号</Label>
                    <Input id="postalCode" placeholder="123-4567" />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="prefecture">都道府県</Label>
                    <select
                      id="prefecture"
                      className="w-full h-10 px-3 border rounded-md"
                    >
                      <option value="">選択してください</option>
                      <option value="東京都">東京都</option>
                      <option value="大阪府">大阪府</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="city">市区町村</Label>
                  <Input id="city" placeholder="渋谷区" />
                </div>
                <div>
                  <Label htmlFor="address">番地</Label>
                  <Input id="address" placeholder="1-2-3" />
                </div>
                <div>
                  <Label htmlFor="building">建物名・部屋番号（任意）</Label>
                  <Input id="building" placeholder="〇〇マンション101" />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
                <Button onClick={() => setCurrentStep(3)}>
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
                  defaultValue="1"
                  className="w-32"
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>アダアフィプラン × 1回線</span>
                  <span>¥3,980</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>月額合計（税込）</span>
                  <span>¥3,980</span>
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
                  <p>アダアフィプラン - 1回線</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">ご契約者情報</h4>
                  <p>山田 太郎（ヤマダ タロウ）</p>
                  <p className="text-sm text-muted-foreground">
                    example@email.com
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">月額料金</h4>
                  <p className="text-xl font-bold">¥3,980（税込）</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-2">
                  <Checkbox id="terms" />
                  <span className="text-sm">
                    <a href="#" className="text-primary underline">
                      利用規約
                    </a>
                    に同意します
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <Checkbox id="privacy" />
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
                <Button>申込みを送信</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
