import {
  CONDITION_LABELS,
  KIND_LABELS,
  MEDIA_LABELS,
  PLATFORM_LABELS,
  STATUS_LABELS,
  type CollectionItem,
} from "./types";

const audWhole = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const audExact = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Whole-dollar AUD for approximate market estimates — never fake cents. */
export function formatAudEstimate(amount: number): string {
  return audWhole.format(Math.round(amount));
}

/** Purchase / cost figures, preserving cents the user actually entered. */
export function formatAudExact(amount: number): string {
  return Number.isInteger(amount) ? audWhole.format(amount) : audExact.format(amount);
}

export function formatSignedAud(amount: number): string {
  const abs = formatAudEstimate(Math.abs(amount));
  if (amount > 0) return `+${abs}`;
  if (amount < 0) return `−${abs}`;
  return abs;
}

export function itemSubtitle(item: CollectionItem): string {
  const bits = [
    PLATFORM_LABELS[item.platform],
    item.itemKind === "hardware" ? KIND_LABELS.hardware : MEDIA_LABELS[item.media],
    CONDITION_LABELS[item.condition],
  ];
  if (item.edition.trim()) bits.push(item.edition.trim());
  return bits.join(" · ");
}

export function statusLabel(item: CollectionItem): string {
  return STATUS_LABELS[item.status];
}

export function initials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}
