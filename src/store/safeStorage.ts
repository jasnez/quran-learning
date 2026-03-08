/**
 * Returns a storage object safe for SSR: no-op when window/localStorage is not available (e.g. on Vercel server).
 * Use with Zustand persist createJSONStorage(() => getSafeStorage()) to avoid client-side exceptions.
 */
export function getSafeStorage(): Storage {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;
  }
  return window.localStorage;
}
