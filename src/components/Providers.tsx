"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { CollectionProvider } from "@/components/CollectionProvider";
import { AppHeader } from "@/components/AppHeader";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { isClerkConfigured } from "@/lib/config";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const tree = (
    <CollectionProvider>
      <AppHeader />
      <main className="flex-1">{children}</main>
    </CollectionProvider>
  );

  if (!isClerkConfigured()) return tree;

  return (
    <ClerkProvider appearance={clerkAppearance} afterSignOutUrl="/">
      {tree}
    </ClerkProvider>
  );
}
