"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Loader2 } from "lucide-react";

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVATED":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            開通済み
          </span>
        );
      case "SHIPPED":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            発送済み
          </span>
        );
      case "SHIPPING_INSTRUCTED":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border border-gray-300 text-gray-600">
            発送指示済み
          </span>
        );
      case "NOT_ACTIVATED":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            未開通
          </span>
        );
      case "RETURNED":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            返却済み
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            解約
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
      return line.status === "ACTIVATED" || line.status === "SHIPPED" || line.status === "SHIPPING_INSTRUCTED";
    if (activeTab === "cancelled")
      return line.status === "CANCELLED" || line.status === "RETURNED";
    return true;
  });

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
                        <TableHead className="min-w-[110px]">電話番号</TableHead>
                        <TableHead className="min-w-[100px]">プラン</TableHead>
                        <TableHead className="min-w-[100px]">申込番号</TableHead>
                        <TableHead className="min-w-[90px]">申込日</TableHead>
                        <TableHead className="min-w-[100px]">ステータス</TableHead>
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
                            {new Date(line.application.createdAt).toLocaleDateString("ja-JP")}
                          </TableCell>
                          <TableCell>{getStatusBadge(line.status)}</TableCell>
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
