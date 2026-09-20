"use client";

import { useRef, useState } from "react";
import {
  PHOTO_MAX_DIMENSION,
  PHOTO_MAX_PER_ITEM,
  compressImageFile,
} from "@/lib/compress-image";
import {
  discardPendingPhoto,
  isPendingPhotoId,
  stashPendingPhoto,
} from "@/lib/photos";
import { usePhotoUrls } from "@/lib/use-photo-url";

export function PhotoPicker({
  photoIds,
  onChange,
  disabled = false,
  remoteUrls = {},
}: {
  photoIds: string[];
  onChange: (photoIds: string[]) => void;
  disabled?: boolean;
  remoteUrls?: Record<string, string>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceIndex = useRef<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const urls = usePhotoUrls(photoIds, remoteUrls);
  const remaining = PHOTO_MAX_PER_ITEM - photoIds.length;

  async function ingestFiles(files: FileList | File[], mode: "append" | "replace") {
    const list = Array.from(files).filter(Boolean);
    if (list.length === 0) return;

    setBusy(true);
    setMessage(null);
    try {
      const slot =
        mode === "replace" && replaceIndex.current != null
          ? 1
          : Math.max(0, PHOTO_MAX_PER_ITEM - photoIds.length);
      if (slot <= 0) {
        setMessage(`Only ${PHOTO_MAX_PER_ITEM} photos per item.`);
        return;
      }
      const take = list.slice(0, slot);
      if (mode === "append" && list.length > slot) {
        setMessage(
          `Only ${PHOTO_MAX_PER_ITEM} photos per item — extra files skipped.`,
        );
      }

      const next = [...photoIds];
      for (const file of take) {
        const compressed = await compressImageFile(file);
        const id = stashPendingPhoto(compressed);
        if (mode === "replace" && replaceIndex.current != null) {
          const oldId = next[replaceIndex.current];
          next[replaceIndex.current] = id;
          if (oldId && isPendingPhotoId(oldId)) discardPendingPhoto(oldId);
        } else {
          next.push(id);
        }
      }
      onChange(next);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not add that photo.",
      );
    } finally {
      setBusy(false);
      replaceIndex.current = null;
      if (inputRef.current) inputRef.current.value = "";
      if (replaceRef.current) replaceRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    const id = photoIds[index];
    if (id && isPendingPhotoId(id)) discardPendingPhoto(id);
    onChange(photoIds.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const next = [...photoIds];
    const [picked] = next.splice(index, 1);
    if (!picked) return;
    next.unshift(picked);
    onChange(next);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label
          htmlFor="photos"
          className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]"
        >
          Photos
        </label>
        <span className="text-[11px] text-[var(--muted)]">
          {photoIds.length}/{PHOTO_MAX_PER_ITEM}
        </span>
      </div>

      {photoIds.length > 0 ? (
        <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photoIds.map((id, index) => (
            <li
              key={id}
              className="relative overflow-hidden rounded-md border border-[var(--line)] bg-[var(--panel)]"
            >
              <div className="aspect-[3/4] bg-[var(--ink)]">
                {urls[id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urls[id]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full animate-pulse bg-[var(--panel-2)]" />
                )}
              </div>
              {index === 0 ? (
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--amber)]">
                  Cover
                </span>
              ) : null}
              <div className="flex flex-col gap-1 p-1.5">
                {index > 0 ? (
                  <button
                    type="button"
                    className="min-h-8 rounded-full px-2 py-1 text-[11px] text-[var(--text)] hover:bg-[var(--panel-2)]"
                    onClick={() => makeCover(index)}
                    disabled={disabled || busy}
                  >
                    Use as cover
                  </button>
                ) : null}
                <button
                  type="button"
                  className="min-h-8 rounded-full px-2 py-1 text-[11px] text-[var(--text)] hover:bg-[var(--panel-2)]"
                  onClick={() => {
                    replaceIndex.current = index;
                    replaceRef.current?.click();
                  }}
                  disabled={disabled || busy}
                >
                  Replace
                </button>
                <button
                  type="button"
                  className="min-h-8 rounded-full px-2 py-1 text-[11px] text-[var(--loss)] hover:bg-[var(--panel-2)]"
                  onClick={() => removeAt(index)}
                  disabled={disabled || busy}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        id="photos"
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={disabled || busy || remaining <= 0}
        onChange={(event) => {
          if (event.target.files) void ingestFiles(event.target.files, "append");
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        disabled={disabled || busy}
        onChange={(event) => {
          if (event.target.files) void ingestFiles(event.target.files, "replace");
        }}
      />

      <button
        type="button"
        className="btn-ghost min-h-11 w-full sm:w-auto"
        disabled={disabled || busy || remaining <= 0}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Compressing…" : remaining <= 0 ? "Photo limit reached" : "Add photos"}
      </button>

      <p className="mt-2 text-xs text-[var(--muted)]">
        Compressed to {PHOTO_MAX_DIMENSION}px JPEG/WebP, max {PHOTO_MAX_PER_ITEM} per
        item. Guest copies stay in IndexedDB; after sign-in they upload to your
        account. First photo is the shelf card — cover URL is a fallback.
      </p>
      {message ? <p className="mt-1 text-xs text-[var(--amber)]">{message}</p> : null}
    </div>
  );
}
