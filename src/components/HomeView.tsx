"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { ItemCard } from "@/components/ItemCard";
import { TotalsBar } from "@/components/TotalsBar";
import { useCollection } from "@/components/CollectionProvider";
import { DEFAULT_FILTERS, filterItems, recentItems } from "@/lib/filters";

export function HomeView() {
  const { items, totals, hydrated, deleteSamples, exportCsv } = useCollection();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const visible = useMemo(() => filterItems(items, filters), [items, filters]);
  const recent = useMemo(() => recentItems(items, 4), [items]);
  const sampleCount = items.filter((item) => item.isSample).length;

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-[var(--muted)]">
        Opening your shelf…
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 pb-24">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--xbox)]">Your collection</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl">
          What’s on the shelf
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
          Guest-first tracker for Xbox One disks, consoles, and the rest of the pile.
          Saved in this browser only.
        </p>
      </div>

      <TotalsBar totals={totals} />

      {sampleCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-[var(--amber)]/40 bg-[var(--panel)] px-4 py-3">
          <p className="text-sm text-[var(--muted)]">
            {sampleCount} sample {sampleCount === 1 ? "item" : "items"} are here so you can
            poke around. Delete them before logging real games.
          </p>
          <button type="button" className="btn-ghost" onClick={deleteSamples}>
            Remove samples
          </button>
        </div>
      ) : null}

      {recent.length > 0 ? (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-xl">Recently added</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {recent.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl">Browse</h2>
          <button
            type="button"
            onClick={exportCsv}
            disabled={items.length === 0}
            className="text-xs text-[var(--muted)] underline-offset-2 hover:underline disabled:opacity-40 sm:hidden"
          >
            Export CSV
          </button>
        </div>
        <FilterBar filters={filters} onChange={setFilters} />
        {visible.length === 0 ? (
          <EmptyState hasItems={items.length > 0} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ hasItems }: { hasItems: boolean }) {
  return (
    <div className="shelf-panel px-5 py-10 text-center">
      <p className="font-[family-name:var(--font-display)] text-xl">
        {hasItems ? "Nothing matches those filters" : "Shelf is empty"}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
        {hasItems
          ? "Clear filters or try another title."
          : "Start with an Xbox One disk: title, condition, and what you paid."}
      </p>
      {!hasItems ? (
        <Link href="/add" className="btn-primary mt-5 inline-flex">
          Add your first disk
        </Link>
      ) : null}
    </div>
  );
}
