import type { CollectionItem, Condition, ItemKind, Platform } from "./types";

export type EstimateSource = "manual" | "placeholder";

export interface ValueEstimate {
  amountAud: number;
  source: EstimateSource;
  /** Human-readable honesty label. */
  label: string;
}

/**
 * Rounded AUD placeholders for common Xbox One-era titles.
 * These are ballpark second-hand AU figures (whole dollars), not live quotes.
 * PriceCharting and similar services require paid keys — we do not invent cents.
 */
const CATALOG: Array<{
  title: string;
  platform: Platform;
  kind: ItemKind;
  /** Approximate complete-in-box / typical used AUD. */
  cibAud: number;
}> = [
  { title: "halo 5 guardians", platform: "xbox-one", kind: "game", cibAud: 15 },
  { title: "forza horizon 3", platform: "xbox-one", kind: "game", cibAud: 25 },
  { title: "gears of war 4", platform: "xbox-one", kind: "game", cibAud: 15 },
  { title: "minecraft", platform: "xbox-one", kind: "game", cibAud: 10 },
  { title: "sea of thieves", platform: "xbox-one", kind: "game", cibAud: 15 },
  { title: "rare replay", platform: "xbox-one", kind: "game", cibAud: 20 },
  { title: "sunset overdrive", platform: "xbox-one", kind: "game", cibAud: 20 },
  { title: "quantum break", platform: "xbox-one", kind: "game", cibAud: 15 },
  { title: "ori and the blind forest", platform: "xbox-one", kind: "game", cibAud: 20 },
  { title: "cuphead", platform: "xbox-one", kind: "game", cibAud: 25 },
  { title: "xbox one", platform: "xbox-one", kind: "hardware", cibAud: 100 },
  { title: "xbox one s", platform: "xbox-one", kind: "hardware", cibAud: 120 },
  { title: "xbox one x", platform: "xbox-one", kind: "hardware", cibAud: 180 },
  { title: "kinect", platform: "xbox-one", kind: "hardware", cibAud: 40 },
  { title: "xbox one controller", platform: "xbox-one", kind: "hardware", cibAud: 35 },
];

const CONDITION_FACTOR: Record<Condition, number> = {
  "new-sealed": 1.8,
  cib: 1,
  good: 0.8,
  loose: 0.55,
  fair: 0.35,
};

const FALLBACK_CIB: Record<ItemKind, Partial<Record<Platform, number>>> = {
  game: {
    "xbox-one": 15,
    "xbox-360": 10,
    "xbox-series": 40,
    ps4: 15,
    ps5: 40,
    switch: 35,
    pc: 10,
    other: 15,
  },
  hardware: {
    "xbox-one": 80,
    "xbox-360": 50,
    "xbox-series": 350,
    ps4: 80,
    ps5: 350,
    switch: 200,
    pc: 100,
    other: 50,
  },
};

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function lookupCatalog(
  title: string,
  platform: Platform,
  kind: ItemKind,
): number | null {
  const needle = normalizeTitle(title);
  if (!needle) return null;
  const hit = CATALOG.find((row) => {
    if (row.platform !== platform || row.kind !== kind) return false;
    return needle === row.title || needle.includes(row.title) || row.title.includes(needle);
  });
  return hit ? hit.cibAud : null;
}

function roundAud(amount: number): number {
  if (amount < 10) return Math.max(1, Math.round(amount));
  return Math.round(amount / 5) * 5;
}

export function suggestPlaceholderAud(input: {
  title: string;
  platform: Platform;
  condition: Condition;
  itemKind: ItemKind;
  media: CollectionItem["media"];
}): number {
  const catalog = lookupCatalog(input.title, input.platform, input.itemKind);
  const base =
    catalog ??
    FALLBACK_CIB[input.itemKind][input.platform] ??
    15;
  const mediaFactor =
    input.itemKind === "game" && input.media === "digital"
      ? 0.7
      : input.itemKind === "game" && input.media === "both"
        ? 1.15
        : 1;
  return roundAud(base * CONDITION_FACTOR[input.condition] * mediaFactor);
}

export function resolveItemValue(item: CollectionItem): ValueEstimate {
  if (item.estimatedMarketValueAud != null && Number.isFinite(item.estimatedMarketValueAud)) {
    return {
      amountAud: Math.round(item.estimatedMarketValueAud),
      source: "manual",
      label: "Manual",
    };
  }
  const amountAud = suggestPlaceholderAud(item);
  const known = lookupCatalog(item.title, item.platform, item.itemKind) != null;
  return {
    amountAud,
    source: "placeholder",
    label: known ? "Approx. placeholder" : "Rough placeholder",
  };
}

export function lineValueAud(item: CollectionItem): number {
  return resolveItemValue(item).amountAud * Math.max(1, item.quantity);
}

export function lineCostAud(item: CollectionItem): number | null {
  if (item.purchasePriceAud == null || !Number.isFinite(item.purchasePriceAud)) {
    return null;
  }
  return item.purchasePriceAud * Math.max(1, item.quantity);
}
