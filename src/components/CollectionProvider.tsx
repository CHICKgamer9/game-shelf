"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { downloadCsv } from "@/lib/csv";
import { deletePhotos } from "@/lib/photos";
import {
  getCollectionSnapshot,
  invalidateCollectionCache,
  newId,
  setCollection,
} from "@/lib/storage";
import { computeTotals } from "@/lib/totals";
import type { CollectionItem, CollectionTotals, ItemDraft } from "@/lib/types";

interface CollectionContextValue {
  items: CollectionItem[];
  totals: CollectionTotals;
  hydrated: boolean;
  addItem: (draft: ItemDraft) => CollectionItem;
  updateItem: (id: string, draft: Partial<ItemDraft>) => void;
  deleteItem: (id: string) => void;
  deleteSamples: () => void;
  exportCsv: () => void;
}

const CollectionContext = createContext<CollectionContextValue | null>(null);

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    if (event.type === "storage") {
      invalidateCollectionCache();
    }
    onStoreChange();
  };
  window.addEventListener("game-shelf:update", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("game-shelf:update", handler);
    window.removeEventListener("storage", handler);
  };
}

function snapshot(): CollectionItem[] {
  return getCollectionSnapshot();
}

const EMPTY_ITEMS: CollectionItem[] = [];

function serverSnapshot(): CollectionItem[] {
  return EMPTY_ITEMS;
}

function clientTrue() {
  return true;
}

function serverFalse() {
  return false;
}

function emptySubscribe() {
  return () => {};
}

function notify() {
  window.dispatchEvent(new Event("game-shelf:update"));
}

function save(items: CollectionItem[]) {
  setCollection(items);
  notify();
}

export function CollectionProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const hydrated = useSyncExternalStore(emptySubscribe, clientTrue, serverFalse);

  const totals = useMemo(() => computeTotals(items), [items]);

  const addItem = useCallback((draft: ItemDraft) => {
    const now = new Date().toISOString();
    const item: CollectionItem = {
      ...draft,
      id: newId(),
      isSample: draft.isSample ?? false,
      createdAt: now,
      updatedAt: now,
    };
    save([item, ...getCollectionSnapshot()]);
    return item;
  }, []);

  const updateItem = useCallback((id: string, draft: Partial<ItemDraft>) => {
    const now = new Date().toISOString();
    save(
      getCollectionSnapshot().map((item) =>
        item.id === id ? { ...item, ...draft, id, updatedAt: now } : item,
      ),
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    const current = getCollectionSnapshot();
    const target = current.find((item) => item.id === id);
    save(current.filter((item) => item.id !== id));
    const photoIds = target?.photoIds ?? [];
    if (photoIds.length > 0) void deletePhotos(photoIds);
  }, []);

  const deleteSamples = useCallback(() => {
    const current = getCollectionSnapshot();
    const removedIds = current
      .filter((item) => item.isSample)
      .flatMap((item) => item.photoIds ?? []);
    save(current.filter((item) => !item.isSample));
    if (removedIds.length > 0) void deletePhotos(removedIds);
  }, []);

  const exportCsv = useCallback(() => {
    downloadCsv(getCollectionSnapshot());
  }, []);

  const value = useMemo(
    () => ({
      items,
      totals,
      hydrated,
      addItem,
      updateItem,
      deleteItem,
      deleteSamples,
      exportCsv,
    }),
    [items, totals, hydrated, addItem, updateItem, deleteItem, deleteSamples, exportCsv],
  );

  return (
    <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>
  );
}

export function useCollection() {
  const ctx = useContext(CollectionContext);
  if (!ctx) {
    throw new Error("useCollection must be used within CollectionProvider");
  }
  return ctx;
}
