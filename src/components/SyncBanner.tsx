"use client";

import Link from "next/link";
import { useCollection } from "@/components/CollectionProvider";

export function SyncBanner() {
  const { clerkEnabled, signedIn, hasKeepableData, syncStatus, syncError, retrySync } =
    useCollection();

  if (signedIn && syncStatus === "error") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--loss)]/40 bg-[var(--panel)] px-4 py-3">
        <p className="text-sm text-[var(--loss)]">
          {syncError ?? "Could not sync this shelf."} Your local copy is still here.
        </p>
        <button type="button" className="btn-ghost" onClick={retrySync}>
          Retry sync
        </button>
      </div>
    );
  }

  if (!clerkEnabled || signedIn || !hasKeepableData) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--xbox)]/30 bg-[var(--panel)] px-4 py-3">
      <p className="text-sm text-[var(--muted)]">
        This shelf is only on this device. Sign in to keep items and photos across
        phones and browsers — nothing here is wiped.
      </p>
      <Link href="/sign-in" className="btn-ghost">
        Save & sync
      </Link>
    </div>
  );
}
