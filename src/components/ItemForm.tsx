"use client";

import type { ReactNode } from "react";
import { PhotoPicker } from "@/components/PhotoPicker";
import {
  CONDITIONS,
  CONDITION_LABELS,
  ITEM_KINDS,
  KIND_LABELS,
  MEDIA,
  MEDIA_LABELS,
  PLATFORMS,
  PLATFORM_LABELS,
  REGIONS,
  STATUSES,
  STATUS_LABELS,
  type CollectionItem,
  type ItemDraft,
  type ItemKind,
  type Platform,
  type Status,
} from "@/lib/types";
import { suggestPlaceholderAud } from "@/lib/estimates";
import { formatAudEstimate } from "@/lib/format";
import { pickPhotoUrls } from "@/lib/photo-urls";

export const EMPTY_DRAFT: ItemDraft = {
  title: "",
  platform: "xbox-one",
  media: "physical",
  condition: "cib",
  quantity: 1,
  purchasePriceAud: null,
  purchaseDate: "",
  notes: "",
  barcode: "",
  region: "PAL",
  edition: "",
  itemKind: "game",
  estimatedMarketValueAud: null,
  coverArtUrl: "",
  photoIds: [],
  photoUrls: {},
  status: "owned",
};

export function draftFromItem(item: CollectionItem): ItemDraft {
  return {
    title: item.title,
    platform: item.platform,
    media: item.media,
    condition: item.condition,
    quantity: item.quantity,
    purchasePriceAud: item.purchasePriceAud,
    purchaseDate: item.purchaseDate ?? "",
    notes: item.notes,
    barcode: item.barcode,
    region: item.region,
    edition: item.edition,
    itemKind: item.itemKind,
    estimatedMarketValueAud: item.estimatedMarketValueAud,
    coverArtUrl: item.coverArtUrl,
    photoIds: item.photoIds ?? [],
    photoUrls: item.photoUrls ?? {},
    status: item.status,
  };
}

function parseMoney(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function parseQty(raw: string): number {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function ItemForm({
  draft,
  onChange,
  onSubmit,
  submitLabel,
  compact = false,
  extraActions,
  busy = false,
}: {
  draft: ItemDraft;
  onChange: (draft: ItemDraft) => void;
  onSubmit: () => void;
  submitLabel: string;
  compact?: boolean;
  extraActions?: ReactNode;
  busy?: boolean;
}) {
  const suggested = suggestPlaceholderAud(draft);
  const set = (patch: Partial<ItemDraft>) => onChange({ ...draft, ...patch });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (busy) return;
        onSubmit();
      }}
    >
      <Field label="Title" htmlFor="title">
        <input
          id="title"
          required
          autoComplete="off"
          placeholder="e.g. Halo 5: Guardians"
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          className="input"
        />
      </Field>

      <PhotoPicker
        photoIds={draft.photoIds ?? []}
        remoteUrls={draft.photoUrls ?? {}}
        onChange={(photoIds) =>
          set({
            photoIds,
            photoUrls: pickPhotoUrls(draft.photoUrls, photoIds),
          })
        }
        disabled={busy}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Kind" htmlFor="kind">
          <select
            id="kind"
            className="input"
            value={draft.itemKind}
            onChange={(e) => set({ itemKind: e.target.value as ItemKind })}
          >
            {ITEM_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="On shelf" htmlFor="status">
          <select
            id="status"
            className="input"
            value={draft.status}
            onChange={(e) => set({ status: e.target.value as Status })}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Platform" htmlFor="platform">
        <select
          id="platform"
          className="input"
          value={draft.platform}
          onChange={(e) => set({ platform: e.target.value as Platform })}
        >
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {PLATFORM_LABELS[platform]}
            </option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          Media
        </legend>
        <div className="flex flex-wrap gap-2">
          {MEDIA.map((media) => (
            <Chip
              key={media}
              active={draft.media === media}
              onClick={() => set({ media })}
              label={MEDIA_LABELS[media]}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          Condition
        </legend>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((condition) => (
            <Chip
              key={condition}
              active={draft.condition === condition}
              onClick={() => set({ condition })}
              label={CONDITION_LABELS[condition]}
            />
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantity" htmlFor="qty">
          <input
            id="qty"
            type="number"
            min={1}
            className="input"
            value={draft.quantity}
            onChange={(e) => set({ quantity: parseQty(e.target.value) })}
          />
        </Field>
        <Field label="Purchase price (AUD)" htmlFor="price">
          <input
            id="price"
            inputMode="decimal"
            placeholder="What you paid"
            className="input"
            value={draft.purchasePriceAud ?? ""}
            onChange={(e) => set({ purchasePriceAud: parseMoney(e.target.value) })}
          />
        </Field>
      </div>

      <Field label="Purchase date" htmlFor="purchased">
        <input
          id="purchased"
          type="date"
          className="input"
          value={draft.purchaseDate ?? ""}
          onChange={(e) => set({ purchaseDate: e.target.value })}
        />
      </Field>

      <Field
        label="Estimated market value (AUD)"
        htmlFor="est"
        hint={`Suggested placeholder: ${formatAudEstimate(suggested)} — override anytime.`}
      >
        <input
          id="est"
          inputMode="decimal"
          placeholder={`${suggested} (placeholder)`}
          className="input"
          value={draft.estimatedMarketValueAud ?? ""}
          onChange={(e) =>
            set({ estimatedMarketValueAud: parseMoney(e.target.value) })
          }
        />
      </Field>

      {!compact ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Barcode / UPC" htmlFor="barcode">
              <input
                id="barcode"
                className="input"
                value={draft.barcode}
                onChange={(e) => set({ barcode: e.target.value })}
              />
            </Field>
            <Field label="Region" htmlFor="region">
              <select
                id="region"
                className="input"
                value={draft.region}
                onChange={(e) => set({ region: e.target.value })}
              >
                <option value="">—</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Edition" htmlFor="edition" hint="GOTY, steelbook, Day One…">
            <input
              id="edition"
              className="input"
              value={draft.edition}
              onChange={(e) => set({ edition: e.target.value })}
            />
          </Field>
          <Field
            label="Cover art URL"
            htmlFor="cover"
            hint="Optional fallback when this item has no photos."
          >
            <input
              id="cover"
              type="url"
              className="input"
              placeholder="https://…"
              value={draft.coverArtUrl}
              onChange={(e) => set({ coverArtUrl: e.target.value })}
            />
          </Field>
          <Field label="Notes" htmlFor="notes">
            <textarea
              id="notes"
              rows={3}
              className="input min-h-[5rem]"
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </Field>
        </>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="submit" className="btn-primary" disabled={busy}>
          {submitLabel}
        </button>
        {extraActions}
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm ${
        active
          ? "bg-[var(--amber)] text-[var(--ink)]"
          : "border border-[var(--line)] text-[var(--text)] hover:border-[var(--amber)]"
      }`}
    >
      {label}
    </button>
  );
}
