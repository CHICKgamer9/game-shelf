import assert from "node:assert/strict";
import { test } from "node:test";
import {
  collectRemotePhotoUrls,
  hasKeepableLocalData,
  mergeShelves,
} from "./sync";
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
    photoUrls: {},
    status: "owned",
    isSample: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

test("empty cloud keeps every local item, including samples", () => {
  const local = [
    item({ id: "sample-1", isSample: true, title: "Sample" }),
    item({ id: "real-1", title: "Forza Horizon 3", updatedAt: "2026-02-01T00:00:00.000Z" }),
  ];
  const result = mergeShelves(local, { items: [], deleted: [] });
  assert.equal(result.items.length, 2);
  assert.equal(result.uploadedFromLocal, 2);
  assert.equal(result.takenFromCloud, 0);
});

test("samples on this device are dropped when the account already has real games", () => {
  const local = [item({ id: "sample-halo-5", isSample: true, title: "Halo 5: Guardians" })];
  const cloud = [
    item({
      id: "cloud-1",
      title: "Gears of War 4",
      createdAt: "2026-03-01T00:00:00.000Z",
    }),
  ];
  const result = mergeShelves(local, { items: cloud, deleted: [] });
  assert.deepEqual(
    result.items.map((entry) => entry.id),
    ["cloud-1"],
  );
});

test("last-write-wins per item uses updatedAt", () => {
  const local = [
    item({
      id: "same",
      title: "Local title",
      notes: "from phone",
      updatedAt: "2026-04-02T00:00:00.000Z",
    }),
  ];
  const cloud = [
    item({
      id: "same",
      title: "Cloud title",
      notes: "from laptop",
      updatedAt: "2026-04-01T00:00:00.000Z",
    }),
  ];
  const result = mergeShelves(local, { items: cloud, deleted: [] });
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0]?.title, "Local title");
  assert.equal(result.items[0]?.notes, "from phone");
});

test("equal timestamps prefer the local copy so sign-in cannot silently wipe", () => {
  const local = [item({ id: "same", title: "Device", updatedAt: "2026-04-01T00:00:00.000Z" })];
  const cloud = [item({ id: "same", title: "Cloud", updatedAt: "2026-04-01T00:00:00.000Z" })];
  const result = mergeShelves(local, { items: cloud, deleted: [] });
  assert.equal(result.items[0]?.title, "Device");
});

test("photo URLs from the losing side are kept for photo ids that still exist", () => {
  const local = [
    item({
      id: "same",
      title: "Edited on phone",
      photoIds: ["p1"],
      photoUrls: {},
      updatedAt: "2026-05-02T00:00:00.000Z",
    }),
  ];
  const cloud = [
    item({
      id: "same",
      title: "Older cloud",
      photoIds: ["p1"],
      photoUrls: { p1: "https://blob.example/p1.webp" },
      updatedAt: "2026-05-01T00:00:00.000Z",
    }),
  ];
  const result = mergeShelves(local, { items: cloud, deleted: [] });
  assert.equal(result.items[0]?.photoUrls.p1, "https://blob.example/p1.webp");
});

test("deleted cloud items do not come back unless the local copy is newer", () => {
  const local = [
    item({ id: "gone", title: "Deleted elsewhere", updatedAt: "2026-01-01T00:00:00.000Z" }),
    item({
      id: "revived",
      title: "Edited after delete",
      updatedAt: "2026-06-02T00:00:00.000Z",
    }),
  ];
  const result = mergeShelves(local, {
    items: [],
    deleted: [
      { id: "gone", deletedAt: "2026-06-01T00:00:00.000Z" },
      { id: "revived", deletedAt: "2026-06-01T00:00:00.000Z" },
    ],
  });
  assert.deepEqual(
    result.items.map((entry) => entry.id),
    ["revived"],
  );
});

test("cloud-only and local-only items are unioned", () => {
  const result = mergeShelves(
    [item({ id: "local", title: "Phone disk", createdAt: "2026-07-02T00:00:00.000Z" })],
    {
      items: [
        item({ id: "cloud", title: "Laptop disk", createdAt: "2026-07-01T00:00:00.000Z" }),
      ],
      deleted: [],
    },
  );
  assert.deepEqual(
    result.items.map((entry) => entry.id),
    ["local", "cloud"],
  );
});

test("hasKeepableLocalData ignores samples", () => {
  assert.equal(hasKeepableLocalData([item({ isSample: true })]), false);
  assert.equal(hasKeepableLocalData([item({ isSample: false })]), true);
});

test("collectRemotePhotoUrls de-duplicates by photo id", () => {
  const urls = collectRemotePhotoUrls([
    item({
      photoIds: ["a", "b"],
      photoUrls: { a: "https://blob.example/a", b: "https://blob.example/b" },
    }),
    item({
      id: "y",
      photoIds: ["a"],
      photoUrls: { a: "https://blob.example/a" },
    }),
  ]);
  assert.equal(urls.length, 2);
});
