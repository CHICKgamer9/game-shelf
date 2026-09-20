"use client";

import { useAuth } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { isClerkConfigured, SYNC_DEBOUNCE_MS } from "@/lib/config";
import { downloadCsv } from "@/lib/csv";
import { deletePhotos } from "@/lib/photos";
import {
  getCollectionSnapshot,
  invalidateCollectionCache,
  newId,
  setCollection,
} from "@/lib/storage";
import { hasKeepableLocalData, mergeShelves } from "@/lib/sync";
import { deleteCloudPhotos, fetchCloudShelf, putCloudShelf } from "@/lib/sync-client";
import { attachRemotePhotoUrls, cacheRemotePhotos } from "@/lib/sync-photos";
import { computeTotals } from "@/lib/totals";
import type { CollectionItem, CollectionTotals, ItemDraft } from "@/lib/types";

export type SyncStatus = "local" | "syncing" | "synced" | "error";

interface CollectionContextValue {
  items: CollectionItem[];
  totals: CollectionTotals;
  hydrated: boolean;
  addItem: (draft: ItemDraft) => CollectionItem;
  updateItem: (id: string, draft: Partial<ItemDraft>) => void;
  deleteItem: (id: string) => void;
  deleteSamples: () => void;
  exportCsv: () => void;
  syncStatus: SyncStatus;
  syncError: string | null;
  signedIn: boolean;
  clerkEnabled: boolean;
  hasKeepableData: boolean;
  retrySync: () => void;
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

function CollectionEngine({
  children,
  authLoaded,
  userId,
}: {
  children: ReactNode;
  authLoaded: boolean;
  userId: string | null;
}) {
  const items = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const hydrated = useSyncExternalStore(emptySubscribe, clientTrue, serverFalse);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const [syncError, setSyncError] = useState<string | null>(null);

  const signedIn = Boolean(userId);
  const applyingRemote = useRef(false);
  const mergedForUser = useRef<string | null>(null);
  const debounceTimer = useRef<number | null>(null);
  const pushGeneration = useRef(0);

  const totals = useMemo(() => computeTotals(items), [items]);
  const hasKeepableData = useMemo(() => hasKeepableLocalData(items), [items]);
  const visibleStatus: SyncStatus =
    userId && syncStatus === "local" ? "syncing" : userId ? syncStatus : "local";
  const visibleError = userId ? syncError : null;

  const pushToCloud = useCallback(async (activeUserId: string) => {
    if (mergedForUser.current !== activeUserId) return;
    const generation = ++pushGeneration.current;
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      const withPhotos = await attachRemotePhotoUrls(getCollectionSnapshot());
      applyingRemote.current = true;
      save(withPhotos);
      applyingRemote.current = false;
      if (generation !== pushGeneration.current) return;
      await putCloudShelf(withPhotos);
      if (generation !== pushGeneration.current) return;
      setSyncStatus("synced");
      setSyncError(null);
    } catch (error) {
      applyingRemote.current = false;
      setSyncStatus("error");
      setSyncError(
        error instanceof Error ? error.message : "Could not sync this shelf.",
      );
    }
  }, []);

  const queuePush = useCallback(() => {
    if (!userId || applyingRemote.current) return;
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      debounceTimer.current = null;
      void pushToCloud(userId);
    }, SYNC_DEBOUNCE_MS);
  }, [pushToCloud, userId]);

  const pullAndMerge = useCallback(async (activeUserId: string) => {
    try {
      const cloud = await fetchCloudShelf();
      const merged = mergeShelves(getCollectionSnapshot(), cloud);
      const withPhotos = await attachRemotePhotoUrls(merged.items);
      applyingRemote.current = true;
      save(withPhotos);
      applyingRemote.current = false;
      mergedForUser.current = activeUserId;
      void cacheRemotePhotos(withPhotos);
      await putCloudShelf(withPhotos);
      setSyncStatus("synced");
      setSyncError(null);
    } catch (error) {
      applyingRemote.current = false;
      setSyncStatus("error");
      setSyncError(
        error instanceof Error ? error.message : "Could not sync this shelf.",
      );
    }
  }, []);

  const addItem = useCallback(
    (draft: ItemDraft) => {
      const now = new Date().toISOString();
      const item: CollectionItem = {
        ...draft,
        id: newId(),
        isSample: draft.isSample ?? false,
        photoUrls: draft.photoUrls ?? {},
        createdAt: now,
        updatedAt: now,
      };
      save([item, ...getCollectionSnapshot()]);
      queuePush();
      return item;
    },
    [queuePush],
  );

  const updateItem = useCallback(
    (id: string, draft: Partial<ItemDraft>) => {
      const now = new Date().toISOString();
      save(
        getCollectionSnapshot().map((item) =>
          item.id === id
            ? {
                ...item,
                ...draft,
                id,
                photoUrls: draft.photoUrls ?? item.photoUrls,
                updatedAt: now,
              }
            : item,
        ),
      );
      queuePush();
    },
    [queuePush],
  );

  const deleteItem = useCallback(
    (id: string) => {
      const current = getCollectionSnapshot();
      const target = current.find((item) => item.id === id);
      save(current.filter((item) => item.id !== id));
      const photoIds = target?.photoIds ?? [];
      if (photoIds.length > 0) {
        void deletePhotos(photoIds);
        if (userId) void deleteCloudPhotos(photoIds).catch(() => undefined);
      }
      queuePush();
    },
    [queuePush, userId],
  );

  const deleteSamples = useCallback(() => {
    const current = getCollectionSnapshot();
    const removedIds = current
      .filter((item) => item.isSample)
      .flatMap((item) => item.photoIds ?? []);
    save(current.filter((item) => !item.isSample));
    if (removedIds.length > 0) void deletePhotos(removedIds);
    queuePush();
  }, [queuePush]);

  const exportCsv = useCallback(() => {
    downloadCsv(getCollectionSnapshot());
  }, []);

  const retrySync = useCallback(() => {
    if (!userId) return;
    mergedForUser.current = null;
    void pullAndMerge(userId);
  }, [pullAndMerge, userId]);

  useEffect(() => {
    if (!authLoaded) return;
    if (!userId) {
      mergedForUser.current = null;
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      return;
    }
    if (mergedForUser.current === userId) return;
    void pullAndMerge(userId);
  }, [authLoaded, pullAndMerge, userId]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
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
      syncStatus: visibleStatus,
      syncError: visibleError,
      signedIn,
      clerkEnabled: isClerkConfigured(),
      hasKeepableData,
      retrySync,
    }),
    [
      items,
      totals,
      hydrated,
      addItem,
      updateItem,
      deleteItem,
      deleteSamples,
      exportCsv,
      visibleStatus,
      visibleError,
      signedIn,
      hasKeepableData,
      retrySync,
    ],
  );

  return (
    <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>
  );
}

function ClerkBackedCollection({ children }: { children: ReactNode }) {
  const { isLoaded, userId } = useAuth();
  return (
    <CollectionEngine authLoaded={isLoaded} userId={userId ?? null}>
      {children}
    </CollectionEngine>
  );
}

export function CollectionProvider({ children }: { children: ReactNode }) {
  if (isClerkConfigured()) {
    return <ClerkBackedCollection>{children}</ClerkBackedCollection>;
  }
  return (
    <CollectionEngine authLoaded userId={null}>
      {children}
    </CollectionEngine>
  );
}

export function useCollection() {
  const ctx = useContext(CollectionContext);
  if (!ctx) {
    throw new Error("useCollection must be used within CollectionProvider");
  }
  return ctx;
}
