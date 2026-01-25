import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { FileText, CheckCircle, Clock, XCircle, Package } from "lucide-react";

export default async function HistoryPage() {
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
    redirect("/dashboard");
  }

  // 申込履歴を取得
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <CheckCircle className="h-3 w-3" />
            承認済み
          </span>
        );
      case "SHIPPED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <Package className="h-3 w-3" />
            発送済み
          </span>
        );
      case "KYC_PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3" />
            本人確認中
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
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="h-3 w-3" />
            却下
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <XCircle className="h-3 w-3" />
            キャンセル
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3" />
            完了
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">申し込み履歴</h1>
        <p className="text-gray-600">過去の申し込み状況を確認できます</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            申込一覧
          </CardTitle>
          <CardDescription>
            全 {applications.length} 件の申込
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              申し込み履歴がありません
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>申込番号</TableHead>
                    <TableHead>申込日</TableHead>
                    <TableHead>プラン</TableHead>
                    <TableHead className="text-right">回線数</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead>ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        {app.applicationNumber}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(app.createdAt).toLocaleDateString("ja-JP")}
                      </TableCell>
                      <TableCell>{app.plan.name}</TableCell>
                      <TableCell className="text-right">
                        {app.lineCount}回線
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(app.totalAmount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ステータス説明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ステータスについて</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                <Clock className="h-3 w-3" />
                本人確認中
              </span>
              <span className="text-sm text-gray-600">
                本人確認書類を審査中です
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <CheckCircle className="h-3 w-3" />
                承認済み
              </span>
              <span className="text-sm text-gray-600">
                審査が完了し、発送準備中です
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <Package className="h-3 w-3" />
                発送済み
              </span>
              <span className="text-sm text-gray-600">
                SIMカードを発送しました
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3" />
                完了
              </span>
              <span className="text-sm text-gray-600">
                開通手続きが完了しました
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
