"use client";

import { useCallback, useSyncExternalStore } from "react";

const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

const read = <T,>(key: string, initial: T, parse: (raw: unknown) => T | null): T => {
  if (cache.has(key)) return cache.get(key) as T;
  let value = initial;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) value = parse(JSON.parse(raw)) ?? initial;
  } catch {
    // Storage blocked or corrupt: fall back to defaults.
  }
  cache.set(key, value);
  return value;
};

/**
 * State mirrored to localStorage. The server render and first client render use
 * `initial` (no hydration mismatch); stored values apply right after hydration.
 * `initial` must be a stable reference.
 */
export const usePersistentState = <T,>(
  key: string,
  initial: T,
  parse: (raw: unknown) => T | null,
): [T, (next: T | ((prev: T) => T)) => void] => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const set = listeners.get(key) ?? new Set();
      set.add(onChange);
      listeners.set(key, set);
      return () => set.delete(onChange);
    },
    [key],
  );

  const value = useSyncExternalStore(
    subscribe,
    () => read(key, initial, parse),
    () => initial,
  );

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = read(key, initial, parse);
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      cache.set(key, resolved);
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Quota or privacy mode: keep the in-memory value.
      }
      listeners.get(key)?.forEach((listener) => listener());
    },
    [key, initial, parse],
  );

  return [value, setValue];
};
