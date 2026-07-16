import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { configuracionApi } from '../api/configuracionApi';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ResponsiveTable';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth.store';
import { ParametroSistema } from '@/types/configuracion';

const schema = z.object({
  clave: z.string().min(1, 'Requerido'),
  valor: z.string().min(1, 'Requerido'),
});
type FormValues = z.infer<typeof schema>;

export const ParametrosTab = () => {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const rol = useAuthStore((s) => s.user?.rol);
  const canManage = rol === 'ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['configuracion', 'parametros'],
    queryFn: configuracionApi.listParametros,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['configuracion', 'parametros'] });

  const upsertMutation = useMutation({
    mutationFn: (values: FormValues) => configuracionApi.upsertParametro(values.clave, values.valor),
    onSuccess: () => {
      toast.success('Parámetro guardado');
      reset({ clave: '', valor: '' });
      setShowForm(false);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: configuracionApi.deleteParametro,
    onSuccess: () => {
      toast.success('Parámetro eliminado');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const columns: ResponsiveTableColumn<ParametroSistema>[] = [
    { header: 'Clave', cell: (p) => <span className="font-mono text-xs">{p.clave}</span> },
    { header: 'Valor', cell: (p) => p.valor },
    ...(canManage
      ? [
          {
            header: '',
            actions: true,
            cell: (p: ParametroSistema) => (
              <Button
                variant="ghost"
                onClick={() => {
                  if (confirm(`¿Eliminar el parámetro "${p.clave}"?`)) deleteMutation.mutate(p.clave);
                }}
              >
                <TrashIcon className="h-4 w-4 text-red-500" />
              </Button>
            ),
          } as ResponsiveTableColumn<ParametroSistema>,
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setShowForm((v) => !v)} variant={showForm ? 'secondary' : 'primary'}>
            <PlusIcon className="h-4 w-4" /> {showForm ? 'Cancelar' : 'Nuevo parámetro'}
          </Button>
        </div>
      )}

      {showForm && (
        <Card>
          <form
            onSubmit={handleSubmit((values) => upsertMutation.mutate(values))}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <Input label="Clave" placeholder="DIAS_VENCIMIENTO_FACTURA" error={errors.clave?.message} {...register('clave')} />
            <Input label="Valor" placeholder="30" error={errors.valor?.message} {...register('valor')} />
            <div className="flex items-end">
              <Button type="submit" loading={upsertMutation.isPending} className="w-full">
                Guardar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <Spinner />
        ) : !data || data.length === 0 ? (
          <EmptyState title="Sin parámetros configurados" />
        ) : (
          <ResponsiveTable data={data} rowKey={(p) => p.id} columns={columns} />
        )}
      </Card>
    </div>
  );
};
