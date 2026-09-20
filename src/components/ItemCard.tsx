import Link from "next/link";
import { CoverArt } from "@/components/CoverArt";
import { resolveItemValue } from "@/lib/estimates";
import { formatAudEstimate, formatAudExact, itemSubtitle } from "@/lib/format";
import type { CollectionItem } from "@/lib/types";

export function ItemCard({ item }: { item: CollectionItem }) {
  const value = resolveItemValue(item);
  const lineValue = value.amountAud * Math.max(1, item.quantity);

  return (
    <Link
      href={`/item/${item.id}`}
      className="group shelf-card flex gap-3 p-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--amber)]"
    >
      <div className="relative h-[92px] w-[68px] shrink-0 overflow-hidden rounded-sm shadow-md">
        <CoverArt item={item} />
        {item.isSample ? (
          <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--amber)]">
            Sample
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold leading-tight group-hover:text-[var(--amber)]">
            {item.title}
          </h3>
          {item.status === "wishlist" ? (
            <span className="shrink-0 rounded-full border border-[var(--line)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
              Wish
            </span>
          ) : null}
        </div>
        <p className="mt-1 truncate text-xs text-[var(--muted)]">{itemSubtitle(item)}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-[family-name:var(--font-display)] text-lg leading-none">
            {formatAudEstimate(lineValue)}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
            {value.label}
          </span>
        </div>
        {item.purchasePriceAud != null ? (
          <p className="mt-1 text-xs text-[var(--muted)]">
            Paid {formatAudExact(item.purchasePriceAud)}
            {item.quantity > 1 ? ` × ${item.quantity}` : ""}
          </p>
        ) : (
          <p className="mt-1 text-xs text-[var(--muted)]">No purchase price</p>
        )}
      </div>
    </Link>
  );
}
