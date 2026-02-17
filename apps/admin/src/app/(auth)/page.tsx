import { DashboardStats } from "@/components/dashboard/dashboard-stats";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
      </div>
      <DashboardStats />
    </div>
  );
}
