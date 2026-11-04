"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/components/cart/cart-context";
import { withBasePath } from "@/lib/base-path";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    // Auth.js's routes sit under the site's base path; signIn() and signOut() read it from here
    <SessionProvider basePath={withBasePath("/api/auth")}>
      <QueryClientProvider client={queryClient}>
        <CartProvider>{children}</CartProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
