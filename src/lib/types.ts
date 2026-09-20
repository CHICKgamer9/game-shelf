export const PLATFORMS = [
  "xbox-one",
  "xbox-360",
  "xbox-series",
  "ps4",
  "ps5",
  "switch",
  "pc",
  "other",
] as const;

export type Platform = (typeof PLATFORMS)[number];

export const MEDIA = ["physical", "digital", "both"] as const;
export type Media = (typeof MEDIA)[number];

export const CONDITIONS = [
  "new-sealed",
  "cib",
  "good",
  "loose",
  "fair",
] as const;
export type Condition = (typeof CONDITIONS)[number];

export const ITEM_KINDS = ["game", "hardware"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export const STATUSES = ["owned", "wishlist"] as const;
export type Status = (typeof STATUSES)[number];

export const REGIONS = ["PAL", "NTSC-U", "NTSC-J", "Other"] as const;
export type Region = (typeof REGIONS)[number];

export interface CollectionItem {
  id: string;
  title: string;
  platform: Platform;
  media: Media;
  condition: Condition;
  quantity: number;
  purchasePriceAud: number | null;
  purchaseDate: string | null;
  notes: string;
  barcode: string;
  region: string;
  edition: string;
  itemKind: ItemKind;
  /** Manual market-value override in whole AUD. Null = use placeholder estimate. */
  estimatedMarketValueAud: number | null;
  /** Optional remote cover; used when the item has no local photos. */
  coverArtUrl: string;
  /** Ordered local photo IDs (IndexedDB blobs). First ID is the shelf card face. */
  photoIds: string[];
  status: Status;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ItemDraft = Omit<
  CollectionItem,
  "id" | "createdAt" | "updatedAt" | "isSample"
> & {
  isSample?: boolean;
};

export interface CollectionTotals {
  itemCount: number;
  pieceCount: number;
  estimatedValueAud: number;
  costBasisAud: number | null;
  costBasisKnownCount: number;
  gainLossAud: number | null;
  ownedCount: number;
  wishlistCount: number;
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  "xbox-one": "Xbox One",
  "xbox-360": "Xbox 360",
  "xbox-series": "Xbox Series X|S",
  ps4: "PlayStation 4",
  ps5: "PlayStation 5",
  switch: "Nintendo Switch",
  pc: "PC",
  other: "Other",
};

export const MEDIA_LABELS: Record<Media, string> = {
  physical: "Physical disk",
  digital: "Digital",
  both: "Disk + digital",
};

export const CONDITION_LABELS: Record<Condition, string> = {
  "new-sealed": "New sealed",
  cib: "CIB",
  good: "Good",
  loose: "Loose",
  fair: "Fair",
};

export const KIND_LABELS: Record<ItemKind, string> = {
  game: "Game",
  hardware: "Hardware",
};

export const STATUS_LABELS: Record<Status, string> = {
  owned: "Owned",
  wishlist: "Wishlist",
};
