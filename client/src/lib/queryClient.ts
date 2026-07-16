import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Persiste las queries exitosas en localStorage para que las pantallas ya
// visitadas (Dashboard, Campos, etc.) sigan mostrando datos sin conexión.
export const queryPersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'yerbatapp-query-cache',
});

// Subir este valor invalida toda la cache persistida (cambios de forma de datos).
export const QUERY_CACHE_BUSTER = 'v1';
