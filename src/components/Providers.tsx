"use client";

import { CollectionProvider } from "@/components/CollectionProvider";
import { AppHeader } from "@/components/AppHeader";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CollectionProvider>
      <AppHeader />
      <main className="flex-1">{children}</main>
    </CollectionProvider>
  );
}
