"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState } from "react";
import { idbPersister } from "@/lib/idb/persister";

// 7 dana — podaci ostaju u IDB i dostupni offline dugo nakon posjete
const PERSIST_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,       // 5 minuta — podaci smatrani svježim
            gcTime: PERSIST_MAX_AGE,          // 7 dana — dugo u memoriji i IDB
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: idbPersister,
        maxAge: PERSIST_MAX_AGE,
        // Ne čekaj na restore IDB podataka pri prvom renderu — prikaži sadržaj odmah
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === "success",
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
