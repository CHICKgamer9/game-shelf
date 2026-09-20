"use client";

import { formatAudEstimate, formatSignedAud } from "@/lib/format";
import type { CollectionTotals } from "@/lib/types";

export function TotalsBar({ totals }: { totals: CollectionTotals }) {
  const gain = totals.gainLossAud;
  const gainClass =
    gain == null
      ? "text-[var(--muted)]"
      : gain >= 0
        ? "text-[var(--gain)]"
        : "text-[var(--loss)]";

  return (
    <section className="shelf-panel overflow-hidden">
      <div className="grid grid-cols-2 gap-px bg-[var(--line)] sm:grid-cols-4">
        <Stat label="Owned items" value={String(totals.itemCount)} hint={`${totals.pieceCount} pieces`} />
        <Stat
          label="Est. value"
          value={formatAudEstimate(totals.estimatedValueAud)}
          hint="Approximate"
        />
        <Stat
          label="Cost basis"
          value={
            totals.costBasisAud == null ? "—" : formatAudEstimate(totals.costBasisAud)
          }
          hint={
            totals.costBasisKnownCount
              ? `${totals.costBasisKnownCount} with a price`
              : "Add purchase prices"
          }
        />
        <Stat
          label="Gain / loss"
          value={gain == null ? "—" : formatSignedAud(gain)}
          hint="Where both known"
          valueClass={gainClass}
        />
      </div>
      <p className="px-4 py-2.5 text-xs leading-relaxed text-[var(--muted)]">
        Estimates are rounded AUD placeholders (condition-adjusted), not live PriceCharting
        quotes. Override any item with your own figure. Wishlist entries are excluded from
        totals.
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  valueClass = "",
}: {
  label: string;
  value: string;
  hint: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-[var(--panel)] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      <p
        className={`mt-1 font-[family-name:var(--font-display)] text-2xl leading-none ${valueClass}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
    </div>
  );
}
