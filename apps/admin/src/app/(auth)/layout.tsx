import { auth } from "@/auth";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { Sidebar, MobileMenuButton } from "@/components/sidebar/sidebar";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={session?.user} />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center gap-3">
            <MobileMenuButton />
            <h1 className="font-bold text-gray-900 text-sm">スーパー回線管理くん</h1>
          </header>
          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
