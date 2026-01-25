import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Check, Smartphone, Shield, Clock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">物販サービス</h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">ログイン</Button>
            </Link>
            <Link href="/apply">
              <Button>お申込み</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-primary/5 to-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            認証用SIMレンタルサービス
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            アダルトアフィリエイト・ポケカ認証など、各種認証に対応したSIMをレンタル
          </p>
          <Link href="/apply">
            <Button size="lg" className="text-lg px-8">
              今すぐ申し込む
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-12">選ばれる理由</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>多様な用途に対応</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  アダアフィ、ポケカ認証、MNP弾など、様々な用途に対応したSIMをご用意
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>安心のサポート</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  専門スタッフが丁寧にサポート。トラブル時も迅速に対応します
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>スピード発送</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  お申込みから最短翌日発送。すぐにご利用いただけます
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-12">料金プラン</h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle>アダアフィプラン</CardTitle>
                <p className="text-3xl font-bold mt-4">
                  ¥3,980<span className="text-base font-normal">/月</span>
                </p>
                <p className="text-sm text-muted-foreground">個人のお客様</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    アダルトアフィリエイト認証対応
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    docomo/au回線
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    最短翌日発送
                  </li>
                </ul>
                <Link href="/apply?plan=adaafi" className="block mt-6">
                  <Button className="w-full">このプランで申し込む</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ポケカプラン</CardTitle>
                <p className="text-3xl font-bold mt-4">
                  ¥2,980<span className="text-base font-normal">/月</span>
                </p>
                <p className="text-sm text-muted-foreground">個人のお客様</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    ポケカ認証対応
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    全キャリア対応
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    最短翌日発送
                  </li>
                </ul>
                <Link href="/apply?plan=pokeka" className="block mt-6">
                  <Button variant="outline" className="w-full">
                    このプランで申し込む
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              法人のお客様は回線数に応じた割引がございます。
              <Link href="/apply" className="text-primary underline ml-1">
                お問い合わせください
              </Link>
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2024 物販サービス. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
