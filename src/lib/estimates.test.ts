import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveItemValue, suggestPlaceholderAud } from "./estimates";
import type { CollectionItem } from "./types";

test("known Xbox One titles get rounded whole-dollar placeholders", () => {
  const amount = suggestPlaceholderAud({
    title: "Halo 5: Guardians",
    platform: "xbox-one",
    condition: "cib",
    itemKind: "game",
    media: "physical",
  });
  assert.equal(amount, 15);
  assert.equal(Number.isInteger(amount), true);
});

test("loose copies are cheaper than CIB, still rounded", () => {
  const cib = suggestPlaceholderAud({
    title: "Forza Horizon 3",
    platform: "xbox-one",
    condition: "cib",
    itemKind: "game",
    media: "physical",
  });
  const loose = suggestPlaceholderAud({
    title: "Forza Horizon 3",
    platform: "xbox-one",
    condition: "loose",
    itemKind: "game",
    media: "physical",
  });
  assert.ok(loose < cib);
  assert.equal(loose % 5, 0);
});

test("manual override wins and is labelled Manual", () => {
  const item = {
    title: "Halo 5: Guardians",
    platform: "xbox-one",
    media: "physical",
    condition: "cib",
    itemKind: "game",
    estimatedMarketValueAud: 42,
  } as CollectionItem;
  const resolved = resolveItemValue(item);
  assert.equal(resolved.amountAud, 42);
  assert.equal(resolved.source, "manual");
  assert.equal(resolved.label, "Manual");
});
