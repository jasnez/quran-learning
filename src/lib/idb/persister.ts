import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

// idb-keyval se importuje dinamički samo na klijentu
// (Next.js može pokušati importovati ovaj fajl na serveru)
async function getIdbKeyval() {
  const { get, set, del } = await import("idb-keyval");
  return { get, set, del };
}

// AsyncStorage adapter koji koristi IndexedDB putem idb-keyval
const idbStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const { get } = await getIdbKeyval();
      const value = await get<string>(key);
      return value ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const { set } = await getIdbKeyval();
      await set(key, value);
    } catch {
      // IDB nije dostupan (npr. privatni mod) — tiho ignoriši
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const { del } = await getIdbKeyval();
      await del(key);
    } catch {
      // Tiho ignoriši
    }
  },
};

export const idbPersister = createAsyncStoragePersister({
  storage: idbStorage,
  key: "QURAN_RQ_CACHE",
  // Debounce upisa u IDB — ne pisati na svaki sitni update
  throttleTime: 1000,
});
