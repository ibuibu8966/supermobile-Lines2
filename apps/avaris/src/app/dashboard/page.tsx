"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
  ChevronRight,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Calendar,
  Building2,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { useDashboard } from "./context";

export default function DashboardPage() {
  const { data, loading } = useDashboard();

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const customer = data?.customer;
  const applications = data?.applications ?? [];
  const lineStats = data?.lineStats ?? { active: 0, pending: 0, cancelled: 0 };

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          顧客情報が見つかりません
        </h1>
        <p className="text-muted-foreground mb-6">
          申し込みを完了してからマイページをご利用ください。
        </p>
        <Link href="/apply">
          <Button>新規申し込み</Button>
        </Link>
      </div>
    );
  }

  const recentApplications = applications.slice(0, 3);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "SHIPPED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3" />
            承認済み
          </span>
        );
      case "SUBMITTED":
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3" />
            審査中
          </span>
        );
      case "REJECTED":
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="h-3 w-3" />
            {status === "REJECTED" ? "却下" : "キャンセル"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ダッシュボード</h1>
        <p className="text-muted-foreground">
          {customer.lastName} {customer.firstName} 様
        </p>
      </div>

      {/* 会員情報カード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            会員情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 基本情報 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">基本情報</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">氏名</p>
                  <p className="font-medium">{customer.lastName} {customer.firstName}</p>
                  <p className="text-xs text-muted-foreground">{customer.lastNameKana} {customer.firstNameKana}</p>
                </div>
              </div>
              {customer.birthDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">生年月日</p>
                    <p className="font-medium">{new Date(customer.birthDate).toLocaleDateString("ja-JP")}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">メールアドレス</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">電話番号</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">住所</p>
                  <p className="font-medium">
                    〒{customer.postalCode} {customer.prefecture}{customer.city}{customer.address}
                    {customer.building && ` ${customer.building}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 法人情報（法人のみ） */}
          {customer.type === "CORPORATE" && customer.companyName && (
            <>
              <div className="border-t border-border" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">法人情報</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">会社名</p>
                      <p className="font-medium">{customer.companyName}</p>
                      {customer.companyNameKana && <p className="text-xs text-muted-foreground">{customer.companyNameKana}</p>}
                    </div>
                  </div>
                  {customer.establishedDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">設立日</p>
                        <p className="font-medium">{new Date(customer.establishedDate).toLocaleDateString("ja-JP")}</p>
                      </div>
                    </div>
                  )}
                  {customer.companyAddress && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">会社住所</p>
                        <p className="font-medium">
                          {customer.companyPostalCode && `〒${customer.companyPostalCode} `}
                          {customer.companyPrefecture}{customer.companyCity}{customer.companyAddress}
                          {customer.companyBuilding && ` ${customer.companyBuilding}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 本人確認書類 */}
          {customer.kycImages.length > 0 && (() => {
            const latestExpiryDate = customer.kycImages
              .map((k) => k.expiryDate)
              .filter(Boolean)
              .sort()
              .at(-1);
            const kyc = customer.kycImages.find((k) => k.expiryDate === latestExpiryDate) ?? customer.kycImages[0];
            const isExpired = kyc.expiryDate && new Date(kyc.expiryDate) < new Date();
            return (
              <>
                <div className="border-t border-border" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">本人確認書類</p>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">有効期限</p>
                        <p className={`font-medium ${isExpired ? "text-red-500" : ""}`}>
                          {kyc.expiryDate ? new Date(kyc.expiryDate).toLocaleDateString("ja-JP") : "未登録"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpired && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <AlertTriangle className="h-3 w-3" />
                          期限切れ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* 回線サマリー */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {lineStats.active}
              </p>
              <p className="text-sm text-muted-foreground mt-1">契約中の回線</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {lineStats.pending}
              </p>
              <p className="text-sm text-muted-foreground mt-1">申込中の回線</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-muted-foreground">
                {lineStats.cancelled}
              </p>
              <p className="text-sm text-muted-foreground mt-1">解約済みの回線</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最新の申込 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              最新の申込
            </CardTitle>
            <CardDescription>直近の申込状況</CardDescription>
          </div>
          <Link href="/dashboard/history">
            <Button variant="ghost" size="sm">
              すべて見る
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentApplications.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">申込がありません</p>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{app.applicationNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {app.plan.name} × {app.lineCount}回線
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(app.status)}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(app.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* クイックリンク */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/apply">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">追加申込</p>
                  <p className="text-sm text-muted-foreground">新しい回線を申し込む</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/lines">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">契約回線一覧</p>
                  <p className="text-sm text-muted-foreground">
                    契約中の回線を確認する
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
