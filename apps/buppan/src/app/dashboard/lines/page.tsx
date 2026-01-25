"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Textarea,
} from "@repo/ui";
import { Phone, AlertTriangle, Loader2 } from "lucide-react";

interface Line {
  id: string;
  lineNumber: number;
  msisdn: string | null;
  status: string;
  shippedAt: string | null;
  application: {
    applicationNumber: string;
    plan: {
      name: string;
    };
    createdAt: string;
  };
}

export default function LinesPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchLines();
  }, []);

  const fetchLines = async () => {
    try {
      const res = await fetch("/api/customer/lines");
      if (res.ok) {
        const data = await res.json();
        setLines(data.lines);
      }
    } catch (error) {
      console.error("Failed to fetch lines:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!selectedLine) return;

    setCancelling(true);
    try {
      const res = await fetch("/api/customer/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineId: selectedLine.id,
          reason: cancelReason,
        }),
      });

      if (res.ok) {
        await fetchLines();
        setCancelDialogOpen(false);
        setSelectedLine(null);
        setCancelReason("");
      } else {
        const data = await res.json();
        alert(data.error || "解約申請に失敗しました");
      }
    } catch (error) {
      alert("解約申請に失敗しました");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "SHIPPED":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            契約中
          </span>
        );
      case "PENDING":
      case "ASSIGNED":
      case "UNASSIGNED":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            処理中
          </span>
        );
      case "CANCELLED":
      case "RETURNED":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            解約済み
          </span>
        );
      case "CANCEL_REQUESTED":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            解約申請中
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const filteredLines = lines.filter((line) => {
    if (activeTab === "all") return true;
    if (activeTab === "active")
      return line.status === "ACTIVE" || line.status === "SHIPPED";
    if (activeTab === "cancelled")
      return line.status === "CANCELLED" || line.status === "RETURNED";
    return true;
  });

  const canCancel = (status: string) => {
    return status === "ACTIVE" || status === "SHIPPED";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">契約回線一覧</h1>
        <p className="text-gray-600">ご契約中の回線を確認できます</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            回線一覧
          </CardTitle>
          <CardDescription>
            全 {lines.length} 件の回線
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">すべて</TabsTrigger>
              <TabsTrigger value="active">契約中</TabsTrigger>
              <TabsTrigger value="cancelled">解約済み</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredLines.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  該当する回線がありません
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>電話番号</TableHead>
                        <TableHead>プラン</TableHead>
                        <TableHead>申込番号</TableHead>
                        <TableHead>契約日</TableHead>
                        <TableHead>ステータス</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-medium">
                            {line.msisdn || "-"}
                          </TableCell>
                          <TableCell>{line.application.plan.name}</TableCell>
                          <TableCell className="text-gray-500">
                            {line.application.applicationNumber}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {line.shippedAt
                              ? new Date(line.shippedAt).toLocaleDateString(
                                  "ja-JP"
                                )
                              : new Date(
                                  line.application.createdAt
                                ).toLocaleDateString("ja-JP")}
                          </TableCell>
                          <TableCell>{getStatusBadge(line.status)}</TableCell>
                          <TableCell>
                            {canCancel(line.status) && (
                              <Dialog
                                open={
                                  cancelDialogOpen && selectedLine?.id === line.id
                                }
                                onOpenChange={(open) => {
                                  setCancelDialogOpen(open);
                                  if (open) {
                                    setSelectedLine(line);
                                  } else {
                                    setSelectedLine(null);
                                    setCancelReason("");
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    解約申請
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                      解約申請
                                    </DialogTitle>
                                    <DialogDescription>
                                      以下の回線の解約を申請します。
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                      <p className="text-sm text-gray-500">
                                        電話番号
                                      </p>
                                      <p className="font-medium">
                                        {line.msisdn || "-"}
                                      </p>
                                      <p className="text-sm text-gray-500 mt-2">
                                        プラン
                                      </p>
                                      <p className="font-medium">
                                        {line.application.plan.name}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">
                                        解約理由（任意）
                                      </label>
                                      <Textarea
                                        value={cancelReason}
                                        onChange={(e) =>
                                          setCancelReason(e.target.value)
                                        }
                                        placeholder="解約理由をご記入ください"
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => setCancelDialogOpen(false)}
                                    >
                                      キャンセル
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={handleCancelRequest}
                                      disabled={cancelling}
                                    >
                                      {cancelling ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          処理中...
                                        </>
                                      ) : (
                                        "解約を申請する"
                                      )}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
