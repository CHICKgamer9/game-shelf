import { resolveItemValue } from "./estimates";
import {
  CONDITION_LABELS,
  KIND_LABELS,
  MEDIA_LABELS,
  PLATFORM_LABELS,
  STATUS_LABELS,
  type CollectionItem,
} from "./types";

function csvCell(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value);
  if (/[",\n]/.test(raw)) return `"${raw.replaceAll('"', '""')}"`;
  return raw;
}

export function collectionToCsv(items: CollectionItem[]): string {
  const header = [
    "title",
    "itemKind",
    "status",
    "platform",
    "media",
    "condition",
    "quantity",
    "purchasePriceAud",
    "purchaseDate",
    "estimatedMarketValueAud",
    "valueSource",
    "barcode",
    "region",
    "edition",
    "coverArtUrl",
    "notes",
    "isSample",
  ];
  const rows = items.map((item) => {
    const value = resolveItemValue(item);
    return [
      item.title,
      KIND_LABELS[item.itemKind],
      STATUS_LABELS[item.status],
      PLATFORM_LABELS[item.platform],
      MEDIA_LABELS[item.media],
      CONDITION_LABELS[item.condition],
      item.quantity,
      item.purchasePriceAud,
      item.purchaseDate,
      value.amountAud,
      value.label,
      item.barcode,
      item.region,
      item.edition,
      item.coverArtUrl,
      item.notes,
      item.isSample ? "sample" : "",
    ]
      .map(csvCell)
      .join(",");
  });
  return [header.join(","), ...rows].join("\n");
}

export function downloadCsv(items: CollectionItem[]): void {
  const blob = new Blob([collectionToCsv(items)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "game-shelf-collection.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
