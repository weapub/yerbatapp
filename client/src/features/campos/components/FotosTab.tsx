import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { camposApi } from '../api/camposApi';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { getErrorMessage } from '@/lib/errors';
import { resolveFileUrl } from '@/lib/url';

export const FotosTab = ({ campoId }: { campoId: string }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: fotos, isLoading } = useQuery({
    queryKey: ['campos', campoId, 'fotos'],
    queryFn: () => camposApi.listFotos(campoId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => camposApi.uploadFoto(campoId, file),
    onSuccess: () => {
      toast.success('Foto subida');
      queryClient.invalidateQueries({ queryKey: ['campos', campoId, 'fotos'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-4">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <div className="flex justify-end">
        <Button onClick={() => fileInputRef.current?.click()} loading={uploadMutation.isPending}>
          <ArrowUpTrayIcon className="h-4 w-4" /> Subir foto
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !fotos || fotos.length === 0 ? (
        <EmptyState icon={<PhotoIcon className="h-8 w-8" />} title="Sin fotos cargadas" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {fotos.map((foto) => (
            <a
              key={foto.id}
              href={resolveFileUrl(foto.url)}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800"
            >
              <img
                src={resolveFileUrl(foto.url)}
                alt={foto.descripcion ?? 'Foto del campo'}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
