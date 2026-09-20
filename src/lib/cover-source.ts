import type { CollectionItem } from "./types";

export type CardFace =
  | { type: "photo"; id: string }
  | { type: "url"; url: string }
  | { type: "placeholder" };

export type CoverFields = Pick<CollectionItem, "photoIds" | "coverArtUrl">;

/** First local photo wins; cover-art URL is the fallback card face. */
export function cardFaceSource(item: CoverFields): CardFace {
  const photoId = item.photoIds[0];
  if (photoId) return { type: "photo", id: photoId };
  const url = item.coverArtUrl.trim();
  if (url) return { type: "url", url };
  return { type: "placeholder" };
}
