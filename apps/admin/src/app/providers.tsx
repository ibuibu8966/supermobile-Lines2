"use client";

import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NuqsAdapter>
        <SWRConfig
          value={{
            fetcher,
            revalidateOnFocus: false,
            dedupingInterval: 2000,
          }}
        >
          {children}
          <Toaster position="top-right" richColors />
        </SWRConfig>
      </NuqsAdapter>
    </SessionProvider>
  );
}
