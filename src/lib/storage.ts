import { SAMPLE_ITEMS } from "./seeds";
import type { CollectionItem } from "./types";

export const STORAGE_KEY = "game-shelf.collection.v1";
export const SEEDED_KEY = "game-shelf.seeded.v1";

let memory: CollectionItem[] | null = null;

function isItem(value: unknown): value is CollectionItem {
  if (!value || typeof value !== "object") return false;
  const item = value as CollectionItem;
  return typeof item.id === "string" && typeof item.title === "string";
}

function readFromStorage(): CollectionItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(isItem);
    }
    const alreadySeeded = window.localStorage.getItem(SEEDED_KEY) === "1";
    if (alreadySeeded) return [];
    persistCollection(SAMPLE_ITEMS);
    window.localStorage.setItem(SEEDED_KEY, "1");
    return SAMPLE_ITEMS;
  } catch {
    return [...SAMPLE_ITEMS];
  }
}

export function getCollectionSnapshot(): CollectionItem[] {
  if (memory) return memory;
  memory = readFromStorage();
  return memory;
}

export function persistCollection(items: CollectionItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.localStorage.setItem(SEEDED_KEY, "1");
}

export function setCollection(items: CollectionItem[]): CollectionItem[] {
  memory = items;
  persistCollection(items);
  return memory;
}

export function invalidateCollectionCache(): void {
  memory = null;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
