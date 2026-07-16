import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PaperClipIcon, PlusIcon } from '@heroicons/react/24/outline';
import { camposApi } from '../api/camposApi';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { getErrorMessage } from '@/lib/errors';
import { resolveFileUrl } from '@/lib/url';

const schema = z.object({
  titulo: z.string().min(2, 'Requerido'),
  descripcion: z.string().min(1, 'Requerido'),
});
type FormValues = z.infer<typeof schema>;

export const NotasTab = ({ campoId }: { campoId: string }) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [uploadingNotaId, setUploadingNotaId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: notas, isLoading } = useQuery({
    queryKey: ['campos', campoId, 'notas'],
    queryFn: () => camposApi.listNotas(campoId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => camposApi.createNota(campoId, values),
    onSuccess: () => {
      toast.success('Nota creada');
      reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['campos', campoId, 'notas'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const adjuntoMutation = useMutation({
    mutationFn: ({ notaId, file }: { notaId: string; file: File }) =>
      camposApi.addNotaAdjunto(campoId, notaId, file),
    onSuccess: () => {
      toast.success('Adjunto agregado');
      queryClient.invalidateQueries({ queryKey: ['campos', campoId, 'notas'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => setUploadingNotaId(null),
  });

  const handleAttachClick = (notaId: string) => {
    setUploadingNotaId(notaId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingNotaId) {
      adjuntoMutation.mutate({ notaId: uploadingNotaId, file });
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-4">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      <div className="flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)} variant={showForm ? 'secondary' : 'primary'}>
          <PlusIcon className="h-4 w-4" /> {showForm ? 'Cancelar' : 'Nueva nota'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form
            onSubmit={handleSubmit((values) => createMutation.mutate(values))}
            className="flex flex-col gap-3"
          >
            <Input label="Título" error={errors.titulo?.message} {...register('titulo')} />
            <Textarea label="Descripción" rows={3} error={errors.descripcion?.message} {...register('descripcion')} />
            <div className="flex justify-end">
              <Button type="submit" loading={createMutation.isPending}>
                Guardar nota
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <Spinner />
      ) : !notas || notas.length === 0 ? (
        <EmptyState title="Sin notas registradas" description="Las notas quedan asociadas a este campo con fecha, hora y usuario." />
      ) : (
        <ul className="flex flex-col gap-3">
          {notas.map((nota) => (
            <Card key={nota.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{nota.titulo}</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{nota.descripcion}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {nota.usuario.nombre} · {new Date(nota.createdAt).toLocaleString('es-AR')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => handleAttachClick(nota.id)}
                  loading={adjuntoMutation.isPending && uploadingNotaId === nota.id}
                  title="Adjuntar archivo"
                >
                  <PaperClipIcon className="h-4 w-4" />
                </Button>
              </div>
              {nota.adjuntos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                  {nota.adjuntos.map((adj) => (
                    <a
                      key={adj.id}
                      href={resolveFileUrl(adj.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <PaperClipIcon className="h-3.5 w-3.5" />
                      {adj.nombreArchivo}
                    </a>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
};
