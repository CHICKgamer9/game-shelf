"use client";

import { SignOutButton, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { isClerkConfigured } from "@/lib/config";
import { useCollection } from "@/components/CollectionProvider";

export function AuthControls() {
  if (!isClerkConfigured()) {
    return (
      <span className="flex items-center gap-2">
        <LocalOnlyBadge />
        <Link
          href="/sign-in"
          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:border-[var(--amber)]"
        >
          Sign in
        </Link>
      </span>
    );
  }
  return <ClerkAuthControls />;
}

function ClerkAuthControls() {
  const { isLoaded, isSignedIn } = useAuth();
  const { syncStatus, syncError, retrySync } = useCollection();

  if (!isLoaded) {
    return <StatusPill label="…" />;
  }

  if (!isSignedIn) {
    return (
      <span className="flex items-center gap-2">
        <LocalOnlyBadge />
        <Link
          href="/sign-in"
          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:border-[var(--amber)]"
        >
          Sign in
        </Link>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      {syncStatus === "error" ? (
        <button
          type="button"
          onClick={retrySync}
          className="rounded-full border border-[var(--loss)]/50 px-2.5 py-1 text-[11px] font-medium text-[var(--loss)]"
          title={syncError ?? "Sync failed"}
        >
          Sync failed · Retry
        </button>
      ) : (
        <StatusPill
          label={syncStatus === "syncing" ? "Syncing" : "Synced"}
          tone={syncStatus === "syncing" ? "muted" : "live"}
        />
      )}
      <SignOutButton>
        <button
          type="button"
          className="hidden rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-[var(--amber)] hover:text-[var(--text)] sm:inline"
        >
          Sign out
        </button>
      </SignOutButton>
      <UserButton appearance={clerkAppearance} />
    </span>
  );
}

function LocalOnlyBadge() {
  return <StatusPill label="Local only" />;
}

function StatusPill({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: "muted" | "live";
}) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${
        tone === "live"
          ? "border-[var(--xbox)]/40 text-[var(--xbox)]"
          : "border-[var(--line)] text-[var(--muted)]"
      }`}
    >
      {label}
    </span>
  );
}
