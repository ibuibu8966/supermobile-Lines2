"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AdminDataProvider } from "@/contexts/admin-data-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NuqsAdapter>
        <AdminDataProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AdminDataProvider>
      </NuqsAdapter>
    </SessionProvider>
  );
}
