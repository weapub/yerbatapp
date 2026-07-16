import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { DocumentTextIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { camposApi } from '../api/camposApi';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { getErrorMessage } from '@/lib/errors';
import { resolveFileUrl } from '@/lib/url';

export const DocumentosTab = ({ campoId }: { campoId: string }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documentos, isLoading } = useQuery({
    queryKey: ['campos', campoId, 'documentos'],
    queryFn: () => camposApi.listDocumentos(campoId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => camposApi.uploadDocumento(campoId, file),
    onSuccess: () => {
      toast.success('Documento subido');
      queryClient.invalidateQueries({ queryKey: ['campos', campoId, 'documentos'] });
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
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      <div className="flex justify-end">
        <Button onClick={() => fileInputRef.current?.click()} loading={uploadMutation.isPending}>
          <ArrowUpTrayIcon className="h-4 w-4" /> Subir documento
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !documentos || documentos.length === 0 ? (
        <EmptyState icon={<DocumentTextIcon className="h-8 w-8" />} title="Sin documentos cargados" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documentos.map((doc) => (
            <Card key={doc.id}>
              <a
                href={resolveFileUrl(doc.url)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3"
              >
                <DocumentTextIcon className="h-8 w-8 shrink-0 text-brand-700 dark:text-brand-300" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{doc.nombre}</p>
                  <p className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleDateString('es-AR')}</p>
                </div>
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
