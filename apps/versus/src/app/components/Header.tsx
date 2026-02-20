"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { href: "/#pricing", label: "料金プラン" },
    { href: "/#features", label: "特徴" },
    { href: "/#faq", label: "よくある質問" },
    { href: "/dashboard", label: "マイページ" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/versus-logo.jpg"
              alt="VERSUS Logo"
              width={32}
              height={32}
              className="rounded"
            />
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-white">VERSUS</span>
              <span className="text-2xl font-bold text-neon">MOBILE</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-neon transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/apply">
              <Button className="bg-neon-gradient text-white font-semibold hover:opacity-90 neon-box-hover transition-all">
                今すぐ申し込む
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="メニュー"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-border pt-4">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-neon transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/apply" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-neon-gradient text-white font-semibold hover:opacity-90">
                  今すぐ申し込む
                </Button>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
