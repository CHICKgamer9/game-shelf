import { cacheRemotePhoto, getPhoto } from "./photos";
import { pickPhotoUrls } from "./photo-urls";
import { collectRemotePhotoUrls } from "./sync";
import { uploadPhotoToCloud } from "./sync-client";
import type { CollectionItem } from "./types";

export async function attachRemotePhotoUrls(
  items: CollectionItem[],
): Promise<CollectionItem[]> {
  const next: CollectionItem[] = [];
  for (const item of items) {
    const photoUrls = { ...item.photoUrls };
    for (const id of item.photoIds) {
      if (photoUrls[id]) continue;
      const photo = await getPhoto(id);
      if (!photo) continue;
      try {
        photoUrls[id] = await uploadPhotoToCloud(photo);
      } catch {
        // Leave the photo local-only; the next signed-in save retries.
      }
    }
    next.push({
      ...item,
      photoUrls: pickPhotoUrls(photoUrls, item.photoIds),
    });
  }
  return next;
}

export async function cacheRemotePhotos(items: CollectionItem[]): Promise<void> {
  const remotes = collectRemotePhotoUrls(items);
  await Promise.all(
    remotes.map(async ({ id, url }) => {
      try {
        await cacheRemotePhoto(id, url);
      } catch {
        // Remote URL still works in <img> if IndexedDB cache fails.
      }
    }),
  );
}
