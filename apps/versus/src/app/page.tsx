import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Check, Gamepad2, Shield, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">バーサス</h1>
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
            ゲーム認証専用SIMサービス
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            ポケカ・各種ゲーム認証に最適化されたSIMをレンタル
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
          <h3 className="text-2xl font-bold text-center mb-12">特徴</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Gamepad2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>ゲーム認証特化</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  ポケカ、各種ゲームの認証に最適化されたSIMを厳選してご提供
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>安定した認証</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  認証成功率の高いSIMを選定。トラブルを最小限に抑えます
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>即日対応</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  最短翌日発送でスピーディーにお届け
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-12">料金プラン</h3>
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-primary">
              <CardHeader className="text-center">
                <CardTitle>バーサス標準プラン</CardTitle>
                <p className="text-3xl font-bold mt-4">
                  ¥4,980<span className="text-base font-normal">/月</span>
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
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    専門サポート
                  </li>
                </ul>
                <Link href="/apply" className="block mt-6">
                  <Button className="w-full">申し込む</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2024 バーサス. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
