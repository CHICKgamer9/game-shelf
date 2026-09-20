import { lineCostAud, lineValueAud } from "./estimates";
import type { CollectionItem, CollectionTotals } from "./types";

export function computeTotals(items: CollectionItem[]): CollectionTotals {
  const owned = items.filter((item) => item.status === "owned");
  const wishlist = items.filter((item) => item.status === "wishlist");

  let estimatedValueAud = 0;
  let costBasisAud = 0;
  let costBasisKnownCount = 0;
  let comparableCost = 0;
  let comparableValue = 0;
  let comparableCount = 0;
  let pieceCount = 0;

  for (const item of owned) {
    const qty = Math.max(1, item.quantity);
    pieceCount += qty;
    const value = lineValueAud(item);
    estimatedValueAud += value;
    const cost = lineCostAud(item);
    if (cost != null) {
      costBasisAud += cost;
      costBasisKnownCount += 1;
      comparableCost += cost;
      comparableValue += value;
      comparableCount += 1;
    }
  }

  return {
    itemCount: owned.length,
    pieceCount,
    estimatedValueAud,
    costBasisAud: costBasisKnownCount > 0 ? costBasisAud : null,
    costBasisKnownCount,
    gainLossAud: comparableCount > 0 ? comparableValue - comparableCost : null,
    ownedCount: owned.length,
    wishlistCount: wishlist.length,
  };
}
