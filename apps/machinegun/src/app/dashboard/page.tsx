import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@repo/ui";
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
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // ユーザーに紐づく顧客情報を取得
  const customer = await prisma.customer.findFirst({
    where: {
      userId: session.user.id,
    },
  });

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          顧客情報が見つかりません
        </h1>
        <p className="text-gray-600 mb-6">
          申し込みを完了してからマイページをご利用ください。
        </p>
        <Link href="/apply">
          <Button>新規申し込み</Button>
        </Link>
      </div>
    );
  }

  // 申込と回線情報を取得
  const applications = await prisma.application.findMany({
    where: {
      customerId: customer.id,
    },
    include: {
      plan: true,
      lines: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 回線ステータス集計
  const allLines = applications.flatMap((app) => app.lines);
  const activeLines = allLines.filter(
    (line) => line.status === "ACTIVATED" || line.status === "SHIPPED"
  );
  const cancelledLines = allLines.filter(
    (line) => line.status === "CANCELLED" || line.status === "RETURNED"
  );
  const pendingLines = allLines.filter(
    (line) =>
      line.status === "NOT_ACTIVATED" ||
      line.status === "ACTIVATED"
  );

  // 最新の申込（最大3件）
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
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-600">
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
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">メールアドレス</p>
              <p className="font-medium">{customer.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">電話番号</p>
              <p className="font-medium">{customer.phone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 md:col-span-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">住所</p>
              <p className="font-medium">
                〒{customer.postalCode} {customer.prefecture}
                {customer.city}
                {customer.address}
                {customer.building && ` ${customer.building}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 回線サマリー */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {activeLines.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">契約中の回線</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {pendingLines.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">処理中の回線</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-400">
                {cancelledLines.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">解約済みの回線</p>
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
            <p className="text-gray-500 text-center py-4">申込がありません</p>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{app.applicationNumber}</p>
                    <p className="text-sm text-gray-500">
                      {app.plan.name} × {app.lineCount}回線
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(app.status)}
                    <p className="text-xs text-gray-400 mt-1">
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
                  <p className="text-sm text-gray-500">新しい回線を申し込む</p>
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
                  <p className="text-sm text-gray-500">
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
