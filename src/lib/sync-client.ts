import type { CloudShelf } from "./sync";
import { normalizeItem } from "./storage";
import type { CollectionItem } from "./types";
import type { StoredPhoto } from "./photos";

export class SyncRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "SyncRequestError";
  }
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "error" in body) {
      const error = (body as { error: unknown }).error;
      if (typeof error === "string" && error.trim()) return error;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export async function fetchCloudShelf(): Promise<CloudShelf> {
  const response = await fetch("/api/collection", { method: "GET" });
  if (!response.ok) {
    throw new SyncRequestError(
      await readError(response, "Could not load the signed-in shelf."),
      response.status,
    );
  }
  const body: unknown = await response.json();
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const items = Array.isArray(record.items)
    ? record.items.filter((item): item is CollectionItem => {
        return Boolean(item && typeof item === "object" && "id" in item);
      }).map(normalizeItem)
    : [];
  const deleted = Array.isArray(record.deleted)
    ? record.deleted.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const row = entry as { id?: unknown; deletedAt?: unknown };
        if (typeof row.id !== "string" || typeof row.deletedAt !== "string") return [];
        return [{ id: row.id, deletedAt: row.deletedAt }];
      })
    : [];
  return { items, deleted };
}

export async function putCloudShelf(items: CollectionItem[]): Promise<void> {
  const response = await fetch("/api/collection", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!response.ok) {
    throw new SyncRequestError(
      await readError(response, "Could not save the shelf to your account."),
      response.status,
    );
  }
}

export async function uploadPhotoToCloud(photo: StoredPhoto): Promise<string> {
  const form = new FormData();
  const ext = photo.mimeType.includes("webp") ? "webp" : "jpg";
  form.set("photoId", photo.id);
  form.set("file", photo.blob, `${photo.id}.${ext}`);
  form.set("mimeType", photo.mimeType);
  form.set("width", String(photo.width));
  form.set("height", String(photo.height));
  const response = await fetch("/api/photos", { method: "POST", body: form });
  if (!response.ok) {
    throw new SyncRequestError(
      await readError(response, "Could not upload a photo."),
      response.status,
    );
  }
  const body: unknown = await response.json();
  const url =
    body && typeof body === "object" && "url" in body
      ? (body as { url: unknown }).url
      : null;
  if (typeof url !== "string" || !url) {
    throw new SyncRequestError("Photo upload did not return a URL.", 500);
  }
  return url;
}

export async function deleteCloudPhotos(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const response = await fetch("/api/photos", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new SyncRequestError(
      await readError(response, "Could not delete synced photos."),
      response.status,
    );
  }
}
