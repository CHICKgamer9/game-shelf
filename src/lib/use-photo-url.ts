"use client";

import { useEffect, useState } from "react";
import { getPendingPhoto, getPhoto, isPendingPhotoId } from "./photos";

export function usePhotoUrl(photoId: string | undefined): string | null {
  const pendingUrl = photoId ? (getPendingPhoto(photoId)?.previewUrl ?? null) : null;
  const [resolved, setResolved] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
    if (!photoId || isPendingPhotoId(photoId)) {
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    void getPhoto(photoId)
      .then((photo) => {
        if (!photo) return;
        const url = URL.createObjectURL(photo.blob);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setResolved({ id: photoId, url });
      })
      .catch(() => {
        if (!cancelled) setResolved(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId]);

  if (pendingUrl) return pendingUrl;
  if (resolved && resolved.id === photoId) return resolved.url;
  return null;
}

export function usePhotoUrls(photoIds: string[]): Record<string, string> {
  const [stored, setStored] = useState<Record<string, string>>({});
  const key = photoIds.join("|");

  useEffect(() => {
    const ids = key.length === 0 ? [] : key.split("|");
    let cancelled = false;
    const created: string[] = [];
    const missing = ids.filter((id) => !getPendingPhoto(id));

    if (missing.length === 0) {
      return () => {
        cancelled = true;
      };
    }

    void Promise.all(
      missing.map(async (id) => {
        const photo = await getPhoto(id);
        if (!photo) return null;
        const url = URL.createObjectURL(photo.blob);
        created.push(url);
        return [id, url] as const;
      }),
    ).then((entries) => {
      if (cancelled) {
        for (const url of created) URL.revokeObjectURL(url);
        return;
      }
      const next: Record<string, string> = {};
      for (const entry of entries) {
        if (entry) next[entry[0]] = entry[1];
      }
      setStored(next);
    });

    return () => {
      cancelled = true;
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [key]);

  const urls: Record<string, string> = {};
  for (const id of photoIds) {
    const pending = getPendingPhoto(id);
    if (pending) urls[id] = pending.previewUrl;
    else if (stored[id]) urls[id] = stored[id];
  }
  return urls;
}
