import assert from "node:assert/strict";
import { test } from "node:test";
import { computeTotals } from "./totals";
import type { CollectionItem } from "./types";

function item(partial: Partial<CollectionItem>): CollectionItem {
  return {
    id: "x",
    title: "Test Game",
    platform: "xbox-one",
    media: "physical",
    condition: "cib",
    quantity: 1,
    purchasePriceAud: null,
    purchaseDate: null,
    notes: "",
    barcode: "",
    region: "",
    edition: "",
    itemKind: "game",
    estimatedMarketValueAud: 20,
    coverArtUrl: "",
    status: "owned",
    isSample: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

test("owned items contribute to estimated value using quantity", () => {
  const totals = computeTotals([
    item({ estimatedMarketValueAud: 10, quantity: 2 }),
    item({ id: "y", estimatedMarketValueAud: 5, quantity: 1 }),
  ]);
  assert.equal(totals.estimatedValueAud, 25);
  assert.equal(totals.pieceCount, 3);
  assert.equal(totals.ownedCount, 2);
});

test("wishlist items are excluded from value and cost", () => {
  const totals = computeTotals([
    item({ estimatedMarketValueAud: 50, purchasePriceAud: 40 }),
    item({
      id: "wish",
      status: "wishlist",
      estimatedMarketValueAud: 90,
      purchasePriceAud: 10,
    }),
  ]);
  assert.equal(totals.estimatedValueAud, 50);
  assert.equal(totals.costBasisAud, 40);
  assert.equal(totals.wishlistCount, 1);
  assert.equal(totals.gainLossAud, 10);
});

test("gain/loss only uses items that have both cost and value", () => {
  const totals = computeTotals([
    item({ estimatedMarketValueAud: 30, purchasePriceAud: 10 }),
    item({ id: "no-cost", estimatedMarketValueAud: 100, purchasePriceAud: null }),
  ]);
  assert.equal(totals.estimatedValueAud, 130);
  assert.equal(totals.costBasisAud, 10);
  assert.equal(totals.gainLossAud, 20);
});

test("missing purchase prices yield null cost basis", () => {
  const totals = computeTotals([item({ purchasePriceAud: null })]);
  assert.equal(totals.costBasisAud, null);
  assert.equal(totals.gainLossAud, null);
});
