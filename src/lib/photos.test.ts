import assert from "node:assert/strict";
import { test } from "node:test";
import { cardFaceSource } from "./cover-source";
import {
  discardPendingPhoto,
  getPendingPhoto,
  isPendingPhotoId,
  stashPendingPhoto,
  takePendingPhoto,
} from "./photos";
import { normalizeItem } from "./storage";
import type { CollectionItem } from "./types";

function item(partial: Partial<CollectionItem>): CollectionItem {
  return {
    id: "x",
    title: "Halo 5: Guardians",
    platform: "xbox-one",
    media: "physical",
    condition: "cib",
    quantity: 1,
    purchasePriceAud: 8,
    purchaseDate: null,
    notes: "",
    barcode: "",
    region: "PAL",
    edition: "",
    itemKind: "game",
    estimatedMarketValueAud: null,
    coverArtUrl: "",
    photoIds: [],
    status: "owned",
    isSample: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

test("card face prefers the first local photo over a cover URL", () => {
  const face = cardFaceSource(
    item({
      photoIds: ["photo-1", "photo-2"],
      coverArtUrl: "https://example.com/cover.jpg",
    }),
  );
  assert.deepEqual(face, { type: "photo", id: "photo-1" });
});

test("card face falls back to cover URL when there are no photos", () => {
  const face = cardFaceSource(
    item({ photoIds: [], coverArtUrl: " https://example.com/cover.jpg " }),
  );
  assert.deepEqual(face, { type: "url", url: "https://example.com/cover.jpg" });
});

test("card face is a placeholder without photos or a URL", () => {
  assert.deepEqual(cardFaceSource(item({ photoIds: [], coverArtUrl: "  " })), {
    type: "placeholder",
  });
});

test("normalizeItem fills missing photoIds on older localStorage records", () => {
  const legacy = {
    ...item(),
  } as CollectionItem;
  delete (legacy as Partial<CollectionItem>).photoIds;
  const normalized = normalizeItem(legacy);
  assert.deepEqual(normalized.photoIds, []);
});

test("normalizeItem drops non-string photo ids", () => {
  const normalized = normalizeItem(
    item({ photoIds: ["keep", "", 12 as unknown as string] }),
  );
  assert.deepEqual(normalized.photoIds, ["keep"]);
});

test("pending photos can be stashed, previewed, and taken", () => {
  const blob = new Blob(["fake-bytes"], { type: "image/jpeg" });
  const id = stashPendingPhoto({
    blob,
    mimeType: "image/jpeg",
    width: 800,
    height: 600,
  });
  assert.equal(isPendingPhotoId(id), true);
  const stored = getPendingPhoto(id);
  assert.ok(stored);
  assert.equal(stored.mimeType, "image/jpeg");
  assert.ok(
    stored.previewUrl.startsWith("blob:") ||
      stored.previewUrl.startsWith("pending://"),
  );
  const taken = takePendingPhoto(id);
  assert.ok(taken);
  assert.equal(taken.width, 800);
  assert.equal(getPendingPhoto(id), null);
});

test("discarding a pending photo removes it", () => {
  const id = stashPendingPhoto({
    blob: new Blob(["x"], { type: "image/webp" }),
    mimeType: "image/webp",
    width: 10,
    height: 10,
  });
  discardPendingPhoto(id);
  assert.equal(getPendingPhoto(id), null);
});
