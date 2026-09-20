import { newId } from "./storage";

export const PHOTOS_DB_NAME = "game-shelf.photos.v1";
const STORE = "photos";
const PENDING_PREFIX = "pending:";

export interface StoredPhoto {
  id: string;
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
}

interface PendingPhoto {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  previewUrl: string;
}

const pending = new Map<string, PendingPhoto>();

export function isPendingPhotoId(id: string): boolean {
  return id.startsWith(PENDING_PREFIX);
}

function makePreviewUrl(blob: Blob): string {
  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    return URL.createObjectURL(blob);
  }
  return `pending://local/${newId()}`;
}

function revokePreviewUrl(url: string): void {
  if (
    url.startsWith("blob:") &&
    typeof URL !== "undefined" &&
    typeof URL.revokeObjectURL === "function"
  ) {
    URL.revokeObjectURL(url);
  }
}

export function stashPendingPhoto(photo: Omit<StoredPhoto, "id">): string {
  const id = `${PENDING_PREFIX}${newId()}`;
  pending.set(id, {
    ...photo,
    previewUrl: makePreviewUrl(photo.blob),
  });
  return id;
}

export function getPendingPhoto(id: string): PendingPhoto | null {
  return pending.get(id) ?? null;
}

export function discardPendingPhoto(id: string): void {
  const entry = pending.get(id);
  if (!entry) return;
  revokePreviewUrl(entry.previewUrl);
  pending.delete(id);
}

export function takePendingPhoto(id: string): Omit<StoredPhoto, "id"> | null {
  const entry = pending.get(id);
  if (!entry) return null;
  pending.delete(id);
  revokePreviewUrl(entry.previewUrl);
  return {
    blob: entry.blob,
    mimeType: entry.mimeType,
    width: entry.width,
    height: entry.height,
  };
}

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("Photos need a browser with IndexedDB."));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PHOTOS_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open photo storage."));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Photo storage failed."));
  });
}

function waitForTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("Photo storage failed."));
    tx.onabort = () =>
      reject(tx.error ?? new Error("Photo storage aborted."));
  });
}

export async function putPhoto(photo: StoredPhoto): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(photo);
    await waitForTransaction(tx);
  } finally {
    db.close();
  }
}

export async function getPhoto(id: string): Promise<StoredPhoto | null> {
  if (isPendingPhotoId(id)) return null;
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readonly");
    const result = await requestToPromise(
      tx.objectStore(STORE).get(id) as IDBRequest<StoredPhoto | undefined>,
    );
    return result ?? null;
  } finally {
    db.close();
  }
}

export async function cacheRemotePhoto(
  id: string,
  url: string,
): Promise<StoredPhoto | null> {
  if (!id || !url || isPendingPhotoId(id)) return null;
  const existing = await getPhoto(id);
  if (existing) return existing;
  const response = await fetch(url);
  if (!response.ok) return null;
  const blob = await response.blob();
  if (blob.size === 0) return null;
  const photo: StoredPhoto = {
    id,
    blob,
    mimeType: blob.type || "image/jpeg",
    width: 0,
    height: 0,
  };
  await putPhoto(photo);
  return photo;
}

export async function deletePhotos(ids: string[]): Promise<void> {
  const persisted = ids.filter((id) => id && !isPendingPhotoId(id));
  if (persisted.length === 0) return;
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const id of persisted) store.delete(id);
    await waitForTransaction(tx);
  } finally {
    db.close();
  }
}

export async function commitDraftPhotos(
  photoIds: string[],
  previousPhotoIds: string[] = [],
): Promise<string[]> {
  const nextIds: string[] = [];
  for (const id of photoIds) {
    const pendingPhoto = takePendingPhoto(id);
    if (pendingPhoto) {
      const persistedId = newId();
      await putPhoto({ id: persistedId, ...pendingPhoto });
      nextIds.push(persistedId);
      continue;
    }
    if (!isPendingPhotoId(id)) nextIds.push(id);
  }

  const keep = new Set(nextIds);
  const removed = previousPhotoIds.filter(
    (id) => !keep.has(id) && !isPendingPhotoId(id),
  );
  await deletePhotos(removed);
  return nextIds;
}
