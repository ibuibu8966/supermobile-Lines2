"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ArrowLeft, AlertCircle, LogIn, Mail, Lock } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setFormError("メールアドレスまたはパスワードが正しくありません");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setFormError("ログイン処理中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>ログイン</CardTitle>
        <CardDescription>
          メールアドレスとパスワードでログイン
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(error || formError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              {formError || "ログインに失敗しました。再度お試しください。"}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">メールアドレス</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="password">パスワード</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              "ログイン中..."
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                ログイン
              </>
            )}
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
  );
}

function LoginFormFallback() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>ログイン</CardTitle>
        <CardDescription>
          メールアドレスとパスワードでログイン
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-10 bg-gray-100 animate-pulse rounded" />
          <div className="h-10 bg-gray-100 animate-pulse rounded" />
          <div className="h-10 bg-gray-100 animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
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

        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
