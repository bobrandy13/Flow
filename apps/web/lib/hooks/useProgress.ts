"use client";

import { useSyncExternalStore } from "react";
import { loadProgress, type ProgressMap } from "@/lib/storage/progress";

/**
 * Subscribes to the persisted progress map. Re-renders the calling
 * component whenever localStorage is updated (across tabs) or whenever
 * we manually write progress in this tab via `notifyProgressChanged`.
 *
 * The cache layer ensures `useSyncExternalStore` sees a stable
 * reference between renders when nothing has changed, which is
 * required for it to avoid infinite render loops.
 */

const EMPTY: ProgressMap = {};
let cachedRaw: string | null = null;
let cachedSnapshot: ProgressMap = EMPTY;

const localListeners = new Set<() => void>();

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  localListeners.add(cb);
  return () => {
    window.removeEventListener("storage", cb);
    localListeners.delete(cb);
  };
}

function getSnapshot(): ProgressMap {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem("flow.progress.v1");
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = loadProgress();
  return cachedSnapshot;
}

function getServerSnapshot(): ProgressMap {
  return EMPTY;
}

/**
 * Call this after mutating progress in the current tab. The native
 * `storage` event only fires in OTHER tabs, so without this, in-tab
 * updates would not re-render subscribers.
 */
export function notifyProgressChanged() {
  for (const cb of localListeners) cb();
}

export function useProgress(): ProgressMap {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
