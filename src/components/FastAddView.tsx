"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCollection } from "@/components/CollectionProvider";
import { EMPTY_DRAFT, ItemForm } from "@/components/ItemForm";
import { commitDraftPhotos } from "@/lib/photos";
import type { ItemDraft } from "@/lib/types";

export function FastAddView() {
  const router = useRouter();
  const { addItem } = useCollection();
  const [draft, setDraft] = useState<ItemDraft>({ ...EMPTY_DRAFT });
  const [more, setMore] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(andAnother: boolean) {
    const title = draft.title.trim();
    if (!title || saving) return;
    setSaving(true);
    setError(null);
    try {
      const photoIds = await commitDraftPhotos(draft.photoIds ?? [], []);
      addItem({
        ...draft,
        photoIds,
        title,
        purchaseDate: draft.purchaseDate || null,
        isSample: false,
      });
      if (andAnother) {
        setDraft({ ...EMPTY_DRAFT, photoIds: [] });
        setFlash(`Saved ${title}. Add the next disk.`);
        setSaving(false);
        return;
      }
      router.push("/");
    } catch (err) {
      setSaving(false);
      setError(
        err instanceof Error
          ? err.message
          : "Could not save photos in this browser.",
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6 pb-24">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--xbox)]">Fast add</p>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-tight">
        Log an Xbox One disk
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Defaults are Xbox One, physical disk, CIB. Add a photo from your camera
        roll if you have one — it stays in this browser.
      </p>

      {flash ? (
        <p className="mt-4 rounded-md border border-[var(--xbox)]/40 bg-[var(--panel)] px-3 py-2 text-sm">
          {flash}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-md border border-[var(--loss)]/40 bg-[var(--panel)] px-3 py-2 text-sm text-[var(--loss)]">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        <ItemForm
          draft={draft}
          onChange={(next) => {
            setDraft(next);
            setFlash(null);
            setError(null);
          }}
          onSubmit={() => void save(false)}
          submitLabel={saving ? "Saving…" : "Save to shelf"}
          compact={!more}
          busy={saving}
          extraActions={
            <>
              <button
                type="button"
                className="btn-ghost"
                disabled={saving}
                onClick={() => void save(true)}
              >
                Save & add another
              </button>
              <button
                type="button"
                className="text-sm text-[var(--muted)] underline-offset-2 hover:underline"
                onClick={() => setMore((v) => !v)}
              >
                {more ? "Hide extra fields" : "Barcode, edition, notes…"}
              </button>
            </>
          }
        />
      </div>

      <p className="mt-8 text-sm text-[var(--muted)]">
        <Link href="/" className="underline-offset-2 hover:underline">
          Back to shelf
        </Link>
      </p>
    </div>
  );
}
