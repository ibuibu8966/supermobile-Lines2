"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui";

const faqItems = [
  {
    question: "申し込みから利用開始までどのくらいかかりますか？",
    answer:
      "本人確認書類の審査完了後、最短翌営業日に発送いたします。到着後すぐにご利用いただけます。",
  },
  {
    question: "法人契約は可能ですか？",
    answer:
      "はい、法人契約に対応しております。回線数に応じた割引もご用意しております。詳しくはお問い合わせください。",
  },
  {
    question: "どのキャリアの回線を使用していますか？",
    answer:
      "docomo、au、SoftBank、楽天モバイルの回線をご用意しております。ご希望のキャリアをお選びいただけます。",
  },
  {
    question: "契約期間の縛りはありますか？",
    answer:
      "最低利用期間は3ヶ月となっております。3ヶ月経過後はいつでも解約可能です。",
  },
  {
    question: "MNP（番号ポータビリティ）には対応していますか？",
    answer:
      "はい、MNP転出に対応しております。MNP予約番号の発行をご希望の場合は、マイページよりお申し込みください。",
  },
  {
    question: "支払い方法は何がありますか？",
    answer:
      "クレジットカード（VISA、Mastercard、JCB、American Express）でのお支払いに対応しております。",
  },
  {
    question: "SIMカードのサイズは選べますか？",
    answer:
      "nano SIM、micro SIM、標準SIMの3種類からお選びいただけます。eSIMにも順次対応予定です。",
  },
  {
    question: "解約時にSIMカードの返却は必要ですか？",
    answer:
      "はい、解約時はSIMカードの返却をお願いしております。返却用の封筒をお送りいたしますので、そちらでご返送ください。",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 bg-card avaris-grid">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">
          よくある<span className="text-avaris">質問</span>
        </h2>
        <p className="text-muted-foreground text-center mb-12">
          お客様からよくいただくご質問をまとめました
        </p>

        <Accordion type="single" collapsible className="space-y-4">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-background border border-border rounded-lg px-6 avaris-glow-hover transition-all"
            >
              <AccordionTrigger className="text-left hover:text-avaris">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
