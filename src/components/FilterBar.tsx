"use client";

import {
  CONDITIONS,
  CONDITION_LABELS,
  ITEM_KINDS,
  KIND_LABELS,
  MEDIA,
  MEDIA_LABELS,
  PLATFORMS,
  PLATFORM_LABELS,
  STATUSES,
  STATUS_LABELS,
} from "@/lib/types";
import { DEFAULT_FILTERS, type ItemFilters } from "@/lib/filters";

export function FilterBar({
  filters,
  onChange,
}: {
  filters: ItemFilters;
  onChange: (filters: ItemFilters) => void;
}) {
  const set = (patch: Partial<ItemFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-col gap-3">
      <label className="sr-only" htmlFor="search">
        Search titles
      </label>
      <input
        id="search"
        className="input"
        placeholder="Search by title, edition, barcode…"
        value={filters.query}
        onChange={(e) => set({ query: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <select
          className="input"
          aria-label="Platform"
          value={filters.platform}
          onChange={(e) =>
            set({ platform: e.target.value as ItemFilters["platform"] })
          }
        >
          <option value="all">All platforms</option>
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {PLATFORM_LABELS[platform]}
            </option>
          ))}
        </select>
        <select
          className="input"
          aria-label="Media"
          value={filters.media}
          onChange={(e) => set({ media: e.target.value as ItemFilters["media"] })}
        >
          <option value="all">All media</option>
          {MEDIA.map((media) => (
            <option key={media} value={media}>
              {MEDIA_LABELS[media]}
            </option>
          ))}
        </select>
        <select
          className="input"
          aria-label="Condition"
          value={filters.condition}
          onChange={(e) =>
            set({ condition: e.target.value as ItemFilters["condition"] })
          }
        >
          <option value="all">All conditions</option>
          {CONDITIONS.map((condition) => (
            <option key={condition} value={condition}>
              {CONDITION_LABELS[condition]}
            </option>
          ))}
        </select>
        <select
          className="input"
          aria-label="Owned or wishlist"
          value={filters.status}
          onChange={(e) => set({ status: e.target.value as ItemFilters["status"] })}
        >
          <option value="all">Owned + wishlist</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <select
          className="input col-span-2 sm:col-span-1"
          aria-label="Kind"
          value={filters.kind}
          onChange={(e) => set({ kind: e.target.value as ItemFilters["kind"] })}
        >
          <option value="all">Games + hardware</option>
          {ITEM_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </div>
      {JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS) ? (
        <button
          type="button"
          className="self-start text-xs text-[var(--muted)] underline-offset-2 hover:text-[var(--text)] hover:underline"
          onClick={() => onChange(DEFAULT_FILTERS)}
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
