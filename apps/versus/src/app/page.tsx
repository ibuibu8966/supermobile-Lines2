import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Settings, FileText, Check } from "lucide-react";
import { prisma } from "@/lib/database";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { FAQ } from "./components/FAQ";

export const revalidate = 60;

async function getPlansWithPricing() {
  const service = await prisma.service.findUnique({
    where: { code: "versus" },
  });

  if (!service) {
    return [];
  }

  const plans = await prisma.plan.findMany({
    where: {
      serviceId: service.id,
      isActive: true,
    },
    include: {
      pricings: {
        orderBy: { minQuantity: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return plans;
}

export default async function LandingPage() {
  const plans = await getPlansWithPricing();

  return (
    <div className="min-h-screen bg-background neon-grid">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--neon-pink)] rounded-full blur-[150px] opacity-20" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[var(--neon-pink-light)] rounded-full blur-[100px] opacity-10" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <Image
                src="/images/versus-logo.jpg"
                alt="VERSUS Logo"
                width={80}
                height={80}
                className="rounded-lg neon-box"
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">仕入れの</span>
              <span className="text-neon neon-text">相棒。</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              認証用SIMレンタルサービス。アダルトアフィリエイト・SMS認証など、
              各種認証に対応したSIMをレンタル。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/apply">
                <Button
                  size="lg"
                  className="bg-neon-gradient text-white font-semibold hover:opacity-90 text-lg px-8 neon-box-hover transition-all"
                >
                  今すぐ申し込む
                </Button>
              </Link>
              <Link href="/#pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-neon text-neon hover:bg-[var(--neon-pink)]/10 text-lg px-8"
                >
                  料金を見る
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Neon line decoration */}
        <div className="absolute bottom-0 left-0 right-0 neon-line" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            <span className="text-neon">VERSUS MOBILE</span>
            <span className="text-white">の特徴</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            認証ビジネスに最適化されたサービス
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-background neon-border neon-box-hover transition-all">
              <CardHeader>
                <div className="h-14 w-14 bg-[var(--neon-pink)]/10 rounded-lg flex items-center justify-center mb-4 neon-box">
                  <Phone className="h-7 w-7 text-neon" />
                </div>
                <CardTitle className="text-white">音声通話込み</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  全プランに音声通話機能を標準搭載。SMS認証にも対応したSIMをご提供します。
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background neon-border neon-box-hover transition-all">
              <CardHeader>
                <div className="h-14 w-14 bg-[var(--neon-pink)]/10 rounded-lg flex items-center justify-center mb-4 neon-box">
                  <Settings className="h-7 w-7 text-neon" />
                </div>
                <CardTitle className="text-white">選べる設計</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  docomo・楽天モバイル回線をご用意。用途に合わせたSIMをご提供します。
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background neon-border neon-box-hover transition-all">
              <CardHeader>
                <div className="h-14 w-14 bg-[var(--neon-pink)]/10 rounded-lg flex items-center justify-center mb-4 neon-box">
                  <FileText className="h-7 w-7 text-neon" />
                </div>
                <CardTitle className="text-white">シンプルな請求</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  回線数に応じた明確な料金体系。隠れた費用は一切なく、予算管理も簡単です。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            <span className="text-white">料金</span>
            <span className="text-neon">プラン</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            回線数に応じたボリュームディスカウント
          </p>

          {plans.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => {
                const lowestPrice = plan.pricings[0]?.unitPrice;
                const isPopular = index === 0;

                return (
                  <Card
                    key={plan.id}
                    className={`bg-card w-full max-w-sm ${
                      isPopular ? "neon-border neon-box" : "border border-border"
                    } relative overflow-hidden neon-box-hover transition-all`}
                  >
                    {isPopular && (
                      <div className="absolute top-0 right-0 bg-neon-gradient text-white text-xs font-bold px-3 py-1">
                        人気
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-white">{plan.name}</CardTitle>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {plan.description}
                        </p>
                      )}
                      {lowestPrice && (
                        <p className="text-3xl font-bold mt-4">
                          <span className="text-neon">
                            ¥{lowestPrice.toLocaleString()}
                          </span>
                          <span className="text-base font-normal text-muted-foreground">
                            /回線/月〜
                          </span>
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      {plan.pricings.length > 0 && (
                        <div className="mb-6">
                          <p className="text-sm text-muted-foreground mb-2">
                            価格表
                          </p>
                          <div className="space-y-1">
                            {plan.pricings.map((pricing) => (
                              <div
                                key={pricing.id}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-muted-foreground">
                                  {pricing.maxQuantity
                                    ? `${pricing.minQuantity}〜${pricing.maxQuantity}回線`
                                    : `${pricing.minQuantity}回線〜`}
                                </span>
                                <span className="text-white font-medium">
                                  ¥{pricing.unitPrice.toLocaleString()}/回線
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {plan.features && plan.features.length > 0 && (
                        <ul className="space-y-2 mb-6">
                          {plan.features.map((feature: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-neon" />
                              <span className="text-muted-foreground">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Link href={`/apply?plan=${plan.code}`}>
                        <Button
                          className={`w-full ${
                            isPopular
                              ? "bg-neon-gradient text-white font-semibold hover:opacity-90"
                              : "border-neon text-neon hover:bg-[var(--neon-pink)]/10"
                          }`}
                          variant={isPopular ? "default" : "outline"}
                        >
                          このプランで申し込む
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                現在利用可能なプランがありません
              </p>
              <Link href="/apply">
                <Button className="bg-neon-gradient text-white font-semibold hover:opacity-90">
                  お問い合わせ
                </Button>
              </Link>
            </div>
          )}

          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              大口契約やカスタムプランについては
              <Link href="/apply" className="text-neon hover:underline ml-1">
                お問い合わせください
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 neon-gradient-bg" />
          <div className="absolute top-0 left-0 right-0 neon-line" />
          <div className="absolute bottom-0 left-0 right-0 neon-line" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="text-white">今すぐ</span>
            <span className="text-neon neon-text">始めましょう</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            お申し込みから最短翌営業日で発送。すぐにご利用いただけます。
          </p>
          <Link href="/apply">
            <Button
              size="lg"
              className="bg-neon-gradient text-white font-semibold hover:opacity-90 text-lg px-12 neon-box-hover transition-all"
            >
              無料で申し込む
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />

      <Footer />
    </div>
  );
}
