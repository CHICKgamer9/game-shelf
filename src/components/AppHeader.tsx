"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthControls } from "@/components/AuthControls";
import { useCollection } from "@/components/CollectionProvider";

export function AppHeader() {
  const pathname = usePathname();
  const { exportCsv, items } = useCollection();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--ink)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--amber)] text-[var(--ink)]">
            <ShelfMark />
          </span>
          <span className="min-w-0">
            <span className="block font-[family-name:var(--font-display)] text-lg leading-none tracking-tight">
              Game Shelf
            </span>
            <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
              Collection · AUD
            </span>
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          <AuthControls />
          <button
            type="button"
            onClick={exportCsv}
            disabled={items.length === 0}
            className="hidden rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-[var(--amber)] hover:text-[var(--text)] disabled:opacity-40 md:inline"
          >
            Export CSV
          </button>
          <Link
            href="/add"
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
              pathname === "/add"
                ? "bg-[var(--xbox)] text-[var(--ink)]"
                : "bg-[var(--amber)] text-[var(--ink)] hover:brightness-110"
            }`}
          >
            Add disk
          </Link>
        </nav>
      </div>
    </header>
  );
}

function ShelfMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="3.2" height="12" rx="0.6" fill="currentColor" />
      <rect x="6.4" y="5" width="3.2" height="10" rx="0.6" fill="currentColor" opacity="0.75" />
      <rect x="10.8" y="4" width="5" height="11" rx="0.6" fill="currentColor" />
    </svg>
  );
}
