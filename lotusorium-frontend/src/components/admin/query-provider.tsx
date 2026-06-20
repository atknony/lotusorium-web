"use client";

import { useState } from "react";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster } from "sonner";
import { BffAuthError } from "@/lib/api/bff-client";

/**
 * Admin data layer provider. A single QueryClient with a global error hook that
 * redirects to the login page whenever the session has fully expired (a 401
 * surfaces as BffAuthError from any query). Also mounts the sonner toaster.
 */
export function AdminQueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (error instanceof BffAuthError) {
              window.location.href = "/yonetim/giris";
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) =>
              !(error instanceof BffAuthError) && failureCount < 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="top-center"
        richColors
        toastOptions={{ style: { fontFamily: "var(--font-sans)" } }}
      />
    </QueryClientProvider>
  );
}
