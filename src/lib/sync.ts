import { mergePhotoUrlMaps, normalizePhotoUrls, pickPhotoUrls } from "./photo-urls";
import { normalizeItem } from "./storage";
import type { CollectionItem } from "./types";

export interface CloudDeletion {
  id: string;
  deletedAt: string;
}

export interface CloudShelf {
  items: CollectionItem[];
  deleted: CloudDeletion[];
}

export interface MergeResult {
  items: CollectionItem[];
  /** Local keepable items that were not already on the account. */
  uploadedFromLocal: number;
  takenFromCloud: number;
}

function timestamp(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isKeepableItem(item: CollectionItem): boolean {
  return !item.isSample;
}

export function hasKeepableLocalData(items: CollectionItem[]): boolean {
  return items.some(isKeepableItem);
}

function prepareLocal(
  local: CollectionItem[],
  cloudItems: CollectionItem[],
): CollectionItem[] {
  const cloudHasKeepable = cloudItems.some(isKeepableItem);
  if (cloudHasKeepable) return local.filter(isKeepableItem);
  return local;
}

/**
 * Last-write-wins per item by `updatedAt`.
 *
 * - Same id on both sides: newer `updatedAt` wins the fields.
 *   Photo URLs are unioned so a newer local edit cannot drop a cloud URL
 *   for a photo id that is still on the winning item.
 * - Local-only id: kept unless the account already deleted it later.
 * - Cloud-only id: kept.
 * - Sample items on this device are dropped when the account already has
 *   real (non-sample) games, so first-visit seeds never wipe a signed-in shelf.
 */
export function mergeShelves(
  localItems: CollectionItem[],
  cloud: CloudShelf,
): MergeResult {
  const cloudItems = cloud.items.map(normalizeItem);
  const local = prepareLocal(localItems.map(normalizeItem), cloudItems);
  const deleted = new Map(
    cloud.deleted.map((entry) => [entry.id, timestamp(entry.deletedAt)]),
  );

  const localById = new Map(local.map((item) => [item.id, item]));
  const cloudById = new Map(cloudItems.map((item) => [item.id, item]));
  const ids = new Set([...localById.keys(), ...cloudById.keys()]);

  const items: CollectionItem[] = [];
  let uploadedFromLocal = 0;
  let takenFromCloud = 0;

  for (const id of ids) {
    const localItem = localById.get(id);
    const cloudItem = cloudById.get(id);
    const deletedAt = deleted.get(id) ?? 0;

    if (localItem && cloudItem) {
      const localNewer =
        timestamp(localItem.updatedAt) >= timestamp(cloudItem.updatedAt);
      const newer = localNewer ? localItem : cloudItem;
      const older = localNewer ? cloudItem : localItem;
      items.push({
        ...newer,
        photoUrls: pickPhotoUrls(
          mergePhotoUrlMaps(older.photoUrls, newer.photoUrls),
          newer.photoIds,
        ),
      });
      if (localNewer) uploadedFromLocal += 1;
      else takenFromCloud += 1;
      continue;
    }

    if (localItem) {
      if (deletedAt && timestamp(localItem.updatedAt) <= deletedAt) continue;
      items.push({
        ...localItem,
        photoUrls: pickPhotoUrls(localItem.photoUrls, localItem.photoIds),
      });
      uploadedFromLocal += 1;
      continue;
    }

    if (cloudItem) {
      if (deletedAt && timestamp(cloudItem.updatedAt) <= deletedAt) continue;
      items.push({
        ...cloudItem,
        photoUrls: pickPhotoUrls(cloudItem.photoUrls, cloudItem.photoIds),
      });
      takenFromCloud += 1;
    }
  }

  items.sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));
  return { items, uploadedFromLocal, takenFromCloud };
}

export function collectRemotePhotoUrls(
  items: CollectionItem[],
): Array<{ id: string; url: string }> {
  const seen = new Set<string>();
  const out: Array<{ id: string; url: string }> = [];
  for (const item of items) {
    const urls = normalizePhotoUrls(item.photoUrls);
    for (const id of item.photoIds) {
      const url = urls[id];
      if (!url || seen.has(id)) continue;
      seen.add(id);
      out.push({ id, url });
    }
  }
  return out;
}

export function collectPhotoUrls(items: CollectionItem[]): string[] {
  return collectRemotePhotoUrls(items).map((entry) => entry.url);
}
