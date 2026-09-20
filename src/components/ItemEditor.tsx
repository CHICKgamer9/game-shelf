"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCollection } from "@/components/CollectionProvider";
import { CoverArt } from "@/components/CoverArt";
import { draftFromItem, ItemForm } from "@/components/ItemForm";
import { resolveItemValue } from "@/lib/estimates";
import { formatAudEstimate } from "@/lib/format";
import type { ItemDraft } from "@/lib/types";

export function ItemEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { items, hydrated, updateItem, deleteItem } = useCollection();
  const item = items.find((entry) => entry.id === id);
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeDraft = useMemo(() => {
    if (draft) return draft;
    if (item) return draftFromItem(item);
    return null;
  }, [draft, item]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8 text-sm text-[var(--muted)]">
        Loading item…
      </div>
    );
  }

  if (!item || !activeDraft) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-[family-name:var(--font-display)] text-2xl">Item not found</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          It may have been deleted, or this is a different browser.
        </p>
        <Link href="/" className="btn-primary mt-5 inline-flex">
          Back to shelf
        </Link>
      </div>
    );
  }

  const preview = { ...item, ...activeDraft };
  const value = resolveItemValue(preview);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6 pb-24">
      <Link href="/" className="text-sm text-[var(--muted)] underline-offset-2 hover:underline">
        ← Shelf
      </Link>
      <div className="mt-4 flex gap-4">
        <div className="h-28 w-20 overflow-hidden rounded-sm shadow-lg">
          <CoverArt item={preview} />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl leading-tight tracking-tight">
            {item.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {formatAudEstimate(value.amountAud * Math.max(1, activeDraft.quantity))} ·{" "}
            {value.label}
          </p>
          {item.isSample ? (
            <p className="mt-2 text-xs uppercase tracking-wide text-[var(--amber)]">
              Sample entry — safe to delete
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-8">
        <ItemForm
          draft={activeDraft}
          onChange={setDraft}
          onSubmit={() => {
            updateItem(item.id, {
              ...activeDraft,
              title: activeDraft.title.trim(),
              purchaseDate: activeDraft.purchaseDate || null,
              isSample: false,
            });
            router.push("/");
          }}
          submitLabel="Save changes"
          extraActions={
            confirmDelete ? (
              <span className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-[var(--loss)]">Delete this item?</span>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    deleteItem(item.id);
                    router.push("/");
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="text-sm text-[var(--loss)] underline-offset-2 hover:underline"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </button>
            )
          }
        />
      </div>
    </div>
  );
}
