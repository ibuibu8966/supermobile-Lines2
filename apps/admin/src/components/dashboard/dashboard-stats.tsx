"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { Loader2, Package, Smartphone, RotateCcw } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api";

interface DashboardStats {
  overview: {
    totalInStockSims: number;
    totalActiveLines: number;
    totalReturningLines: number;
  };
}

export function DashboardStats() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: queryKeys.dashboardStats,
    queryFn: api.getDashboardStats,
    staleTime: 30000, // 30秒間キャッシュ（重複リクエスト防止）
  });

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              SIM在庫
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.overview.totalInStockSims.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">利用可能なSIM</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              利用中回線
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.overview.totalActiveLines.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">アクティブな回線</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              返却済み
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.overview.totalReturningLines.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">返却された回線</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
