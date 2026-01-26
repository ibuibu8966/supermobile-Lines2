"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@repo/ui";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Package,
  FileCheck,
} from "lucide-react";

interface PlanPricing {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
  description: string | null;
}

interface Plan {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  pricings: PlanPricing[];
}

export default function AdditionalApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォームデータ
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [lineCount, setLineCount] = useState<number>(1);
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    cancellation: false,
  });

  const steps = [
    { id: 1, name: "プラン選択" },
    { id: 2, name: "確認・同意" },
  ];

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(data.filter((p: Plan) => p.isActive));
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // 回線数に応じた単価を取得
  const getUnitPrice = (plan: Plan, quantity: number): number => {
    const sortedPricings = [...plan.pricings].sort((a, b) => a.minQuantity - b.minQuantity);
    if (sortedPricings.length === 0) return 0;

    let unitPrice = sortedPricings[0].unitPrice;
    for (const pricing of sortedPricings) {
      if (quantity >= pricing.minQuantity) {
        if (!pricing.maxQuantity || quantity <= pricing.maxQuantity) {
          unitPrice = pricing.unitPrice;
        }
      }
    }
    return unitPrice;
  };

  // プランの基本価格を取得（1回線目の価格）
  const getPlanPrice = (plan: Plan) => {
    return getUnitPrice(plan, 1);
  };

  const canProceedStep1 = () => {
    return selectedPlanId !== "" && lineCount >= 1;
  };

  const canSubmit = () => {
    return agreements.terms && agreements.privacy && agreements.cancellation;
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !selectedPlan) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/customer/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          lineCount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "申込に失敗しました");
      }

      // 完了ページへ
      router.push("/dashboard/apply/complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "申込に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const selectedPlanPrice = selectedPlan ? getPlanPrice(selectedPlan) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          ダッシュボードに戻る
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>追加申込</CardTitle>
          <CardDescription>
            新しい回線を追加申込します
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* ステップインジケーター */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((s, index) => (
                <div key={s.id} className="flex items-center">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2",
                      step >= s.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-gray-300 text-gray-300"
                    )}
                  >
                    {step > s.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{s.id}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "ml-2 text-sm font-medium",
                      step >= s.id ? "text-primary" : "text-gray-400"
                    )}
                  >
                    {s.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "w-16 h-0.5 mx-4",
                        step > s.id ? "bg-primary" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: プラン選択 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">
                  プランを選択してください *
                </Label>
                <div className="mt-3 space-y-3">
                  {plans.map((plan) => {
                    const price = getPlanPrice(plan);
                    return (
                      <div
                        key={plan.id}
                        className={cn(
                          "relative flex items-start p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors",
                          selectedPlanId === plan.id
                            ? "border-primary bg-primary/5"
                            : "border-gray-200"
                        )}
                        onClick={() => setSelectedPlanId(plan.id)}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                            selectedPlanId === plan.id
                              ? "border-primary bg-primary"
                              : "border-gray-300"
                          )}
                        >
                          {selectedPlanId === plan.id && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="font-medium">{plan.name}</div>
                          <div className="mt-1 text-sm text-gray-500">
                            単価: <strong>{formatCurrency(price)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label htmlFor="lineCount" className="text-base font-medium">
                  回線数 *
                </Label>
                <Select
                  value={lineCount.toString()}
                  onValueChange={(v) => setLineCount(parseInt(v))}
                >
                  <SelectTrigger className="w-32 mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}回線
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlan && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">お見積り</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>単価 × {lineCount}回線</span>
                      <span>
                        {formatCurrency(selectedPlanPrice * lineCount)}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                      <span>合計</span>
                      <span>
                        {formatCurrency(selectedPlanPrice * lineCount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: 確認・同意 */}
          {step === 2 && selectedPlan && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  申込内容
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">プラン</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">回線数</span>
                    <span className="font-medium">{lineCount}回線</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">合計金額</span>
                    <span className="font-medium">
                      {formatCurrency(selectedPlanPrice * lineCount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2 text-blue-700">
                  <FileCheck className="h-4 w-4" />
                  本人確認について
                </h4>
                <p className="text-sm text-blue-600">
                  追加申込の場合、以前ご提出いただいた本人確認書類を使用します。
                  新たな書類のアップロードは不要です。
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">同意事項</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={agreements.terms}
                      onCheckedChange={(checked) =>
                        setAgreements({ ...agreements, terms: !!checked })
                      }
                    />
                    <label htmlFor="terms" className="text-sm cursor-pointer">
                      <span className="text-primary underline">利用規約</span>
                      に同意します
                    </label>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="privacy"
                      checked={agreements.privacy}
                      onCheckedChange={(checked) =>
                        setAgreements({ ...agreements, privacy: !!checked })
                      }
                    />
                    <label htmlFor="privacy" className="text-sm cursor-pointer">
                      <span className="text-primary underline">
                        プライバシーポリシー
                      </span>
                      に同意します
                    </label>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="cancellation"
                      checked={agreements.cancellation}
                      onCheckedChange={(checked) =>
                        setAgreements({
                          ...agreements,
                          cancellation: !!checked,
                        })
                      }
                    />
                    <label
                      htmlFor="cancellation"
                      className="text-sm cursor-pointer"
                    >
                      <span className="text-primary underline">
                        解約・返金ポリシー
                      </span>
                      に同意します
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ナビゲーションボタン */}
          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                戻る
              </Button>
            ) : (
              <div />
            )}

            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceedStep1()}>
                次へ
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit() || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    申込中...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    申込を確定する
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
