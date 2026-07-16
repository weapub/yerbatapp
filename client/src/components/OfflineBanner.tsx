import { WifiIcon } from '@heroicons/react/24/outline';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export const OfflineBanner = () => {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-xs font-medium text-amber-950">
      <WifiIcon className="h-4 w-4" />
      Sin conexión — mostrando los últimos datos guardados. Los cambios no se pueden guardar ahora.
    </div>
  );
};
