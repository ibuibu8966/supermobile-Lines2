import { DashboardStats } from "@/components/dashboard/dashboard-stats";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-sm text-muted-foreground mt-1">
          SIM在庫と回線利用状況の概要
        </p>
      </div>
      <DashboardStats />
    </div>
  );
}
