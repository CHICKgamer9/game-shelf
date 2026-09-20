"use client";

import { useState } from "react";
import { CoverArt, type CoverItem } from "@/components/CoverArt";
import { usePhotoUrls } from "@/lib/use-photo-url";

export function ItemPhotoStage({ item }: { item: CoverItem }) {
  const photoIds = item.photoIds ?? [];
  const [active, setActive] = useState(0);
  const urls = usePhotoUrls(photoIds);
  const safeIndex = Math.min(active, Math.max(0, photoIds.length - 1));
  const activeId = photoIds[safeIndex];
  const largeSrc = activeId ? urls[activeId] : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-md border border-[var(--line)] bg-[var(--panel)] shadow-lg">
        <div className="relative aspect-[3/4] max-h-[min(68vw,22rem)] w-full sm:max-h-[22rem]">
          {largeSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={largeSrc} alt="" className="h-full w-full object-contain bg-[var(--ink)]" />
          ) : (
            <CoverArt item={item} />
          )}
        </div>
      </div>
      {photoIds.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {photoIds.map((id, index) => (
            <li key={id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(index)}
                className={`h-16 w-12 overflow-hidden rounded-sm border ${
                  index === safeIndex
                    ? "border-[var(--amber)]"
                    : "border-[var(--line)]"
                }`}
                aria-label={`Photo ${index + 1}`}
                aria-current={index === safeIndex}
              >
                {urls[id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urls[id]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="block h-full w-full bg-[var(--panel-2)]" />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
