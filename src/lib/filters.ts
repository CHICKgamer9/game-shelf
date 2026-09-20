import type { CollectionItem, Condition, Media, Platform, Status } from "./types";

export interface ItemFilters {
  query: string;
  platform: Platform | "all";
  media: Media | "all";
  condition: Condition | "all";
  status: Status | "all";
  kind: CollectionItem["itemKind"] | "all";
}

export const DEFAULT_FILTERS: ItemFilters = {
  query: "",
  platform: "all",
  media: "all",
  condition: "all",
  status: "all",
  kind: "all",
};

export function filterItems(
  items: CollectionItem[],
  filters: ItemFilters,
): CollectionItem[] {
  const q = filters.query.trim().toLowerCase();
  return items.filter((item) => {
    if (filters.platform !== "all" && item.platform !== filters.platform) return false;
    if (filters.media !== "all" && item.media !== filters.media) return false;
    if (filters.condition !== "all" && item.condition !== filters.condition) {
      return false;
    }
    if (filters.status !== "all" && item.status !== filters.status) return false;
    if (filters.kind !== "all" && item.itemKind !== filters.kind) return false;
    if (!q) return true;
    const hay = [
      item.title,
      item.edition,
      item.notes,
      item.barcode,
      item.region,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function recentItems(items: CollectionItem[], limit = 4): CollectionItem[] {
  return [...items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
