import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Componente "headless": no renderiza nada visible por sí mismo, solo conecta
// el ciclo de vida del Service Worker con toasts (actualización disponible /
// app lista para uso offline). Se monta una única vez en App.tsx.
export const PwaUpdatePrompt = () => {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      registration?.update();
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span>Hay una nueva versión de YerbatApp disponible.</span>
          <button
            className="shrink-0 rounded-md bg-brand-800 px-3 py-1 text-xs font-semibold text-white"
            onClick={() => {
              toast.dismiss(t.id);
              updateServiceWorker(true);
            }}
          >
            Actualizar
          </button>
        </div>
      ),
      { duration: Infinity, id: 'pwa-update' },
    );
  }, [needRefresh, updateServiceWorker]);

  useEffect(() => {
    if (!offlineReady) return;
    toast.success('YerbatApp ya está lista para funcionar sin conexión.', { id: 'pwa-offline-ready' });
  }, [offlineReady]);

  return null;
};
