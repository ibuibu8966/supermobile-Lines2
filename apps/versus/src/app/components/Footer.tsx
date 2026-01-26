import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const serviceLinks = [
    { href: "/#pricing", label: "料金プラン" },
    { href: "/#features", label: "特徴" },
    { href: "/apply", label: "お申し込み" },
    { href: "/dashboard", label: "マイページ" },
  ];

  const legalLinks = [
    { href: "/terms", label: "利用規約" },
    { href: "/privacy", label: "プライバシーポリシー" },
    { href: "/legal", label: "特定商取引法に基づく表記" },
  ];

  return (
    <footer className="bg-background border-t border-border py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/images/versus-logo.jpg"
                alt="VERSUS Logo"
                width={24}
                height={24}
                className="rounded"
              />
              <span className="text-xl font-bold text-white">VERSUS</span>
              <span className="text-xl font-bold text-neon">MOBILE</span>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              認証用SIMレンタルサービス
            </p>
            <p className="text-muted-foreground text-sm">
              運営: 合同会社ピーチ
            </p>
          </div>

          {/* Service Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">サービス</h3>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-neon transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">法的情報</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-neon transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <div className="neon-line w-32 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} VERSUS MOBILE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
