import { useEffect } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { queryClient, queryPersister, QUERY_CACHE_BUSTER } from '@/lib/queryClient';
import { router } from '@/routes/router';
import { useUiStore } from '@/store/ui.store';
import { PwaUpdatePrompt } from '@/components/PwaUpdatePrompt';

export const App = () => {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        buster: QUERY_CACHE_BUSTER,
        maxAge: 1000 * 60 * 60 * 24,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.state.status === 'success',
        },
      }}
    >
      <RouterProvider router={router} />
      <PwaUpdatePrompt />
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </PersistQueryClientProvider>
  );
};
