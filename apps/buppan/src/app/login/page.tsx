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
} from "@repo/ui";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            トップページに戻る
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>ログイン</CardTitle>
            <CardDescription>
              メールアドレスとパスワードでログイン
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">パスワード</Label>
                <Input id="password" type="password" required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "ログイン中..." : "ログイン"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <Link href="/forgot-password" className="text-primary underline">
                パスワードをお忘れの方
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground mb-4">
                アカウントをお持ちでない方
              </p>
              <Link href="/apply">
                <Button variant="outline" className="w-full">
                  新規お申込み
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
