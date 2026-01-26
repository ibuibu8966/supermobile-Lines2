import Link from "next/link";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-background avaris-grid">
      <Header />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">
            <span className="text-white">特定商取引法に基づく</span>
            <span className="text-avaris">表記</span>
          </h1>

          <div className="bg-card border border-border rounded-lg p-8 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-avaris mb-2">
                販売業者
              </h2>
              <p className="text-muted-foreground">合同会社ピーチ</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-avaris mb-2">
                運営統括責任者
              </h2>
              <p className="text-muted-foreground">代表社員</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-avaris mb-2">所在地</h2>
              <p className="text-muted-foreground">
                請求があったら遅滞なく開示します
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-avaris mb-2">
                電話番号
              </h2>
              <p className="text-muted-foreground">
                請求があったら遅滞なく開示します
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-avaris mb-2">
                メールアドレス
              </h2>
              <p className="text-muted-foreground">info@example.com</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-avaris mb-2">
                販売価格
              </h2>
              <p className="text-muted-foreground">
                各プランページに表示された価格（税込）
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-avaris mb-2">
                販売価格以外の必要料金
              </h2>
              <p className="text-muted-foreground">
                消費税、送料（初回発送無料、返却時はお客様負担）
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-avaris mb-2">
                支払方法
              </h2>
              <p className="text-muted-foreground">
                クレジットカード（VISA、Mastercard、JCB、American Express）
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-avaris mb-2">
                支払時期
              </h2>
              <p className="text-muted-foreground">
                申込時に初月分をお支払い、以降毎月1日に当月分を課金
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-avaris mb-2">
                商品の引渡時期
              </h2>
              <p className="text-muted-foreground">
                本人確認完了後、3営業日以内に発送
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-avaris mb-2">
                返品・キャンセル
              </h2>
              <p className="text-muted-foreground">
                最低利用期間（3ヶ月）経過後、いつでも解約可能。
                最低利用期間内の解約の場合、残存期間分の利用料をお支払いいただきます。
                SIMカードは解約時に返却が必要です。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-avaris mb-2">
                動作環境
              </h2>
              <p className="text-muted-foreground">
                SIMロック解除済みのスマートフォン、または対応キャリアの端末
              </p>
            </section>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="text-avaris hover:underline">
              トップページに戻る
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
