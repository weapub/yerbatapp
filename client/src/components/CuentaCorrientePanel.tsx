import { useState } from 'react';
import { Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Textarea } from './Textarea';
import { EmptyState } from './EmptyState';
import { Spinner } from './Spinner';
import { ResponsiveTable, ResponsiveTableColumn } from './ResponsiveTable';
import { getErrorMessage } from '@/lib/errors';

interface MovimientoCC {
  id: string;
  monto: number;
  saldo: number;
  fecha: string;
  descripcion: string | null;
}

interface CuentaCorrientePanelProps<TTipo extends string> {
  saldo: number;
  movimientos: MovimientoCC[] | undefined;
  isLoading: boolean;
  canManage: boolean;
  tipoPositivo: TTipo;
  tipoPositivoLabel: string;
  tipoNegativo: TTipo;
  tipoNegativoLabel: string;
  invalidateQueryKey: unknown[];
  onSubmit: (values: { tipo: TTipo; monto: number; fecha: string; descripcion?: string }) => Promise<unknown>;
}

type FormValues<TTipo extends string> = { tipo: TTipo; monto: number; fecha: string; descripcion?: string };

const schemaFor = <TTipo extends string>(positivo: TTipo, negativo: TTipo) =>
  z.object({
    tipo: z.enum([positivo, negativo] as [TTipo, TTipo]),
    monto: z.coerce.number().positive('Debe ser mayor a 0'),
    fecha: z.string().min(1, 'Requerido'),
    descripcion: z.string().optional(),
  });

export function CuentaCorrientePanel<TTipo extends string>({
  saldo,
  movimientos,
  isLoading,
  canManage,
  tipoPositivo,
  tipoPositivoLabel,
  tipoNegativo,
  tipoNegativoLabel,
  invalidateQueryKey,
  onSubmit,
}: CuentaCorrientePanelProps<TTipo>) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const schema = schemaFor(tipoPositivo, tipoNegativo);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues<TTipo>>({
    resolver: zodResolver(schema) as Resolver<FormValues<TTipo>>,
    defaultValues: { tipo: tipoPositivo, fecha: new Date().toISOString().slice(0, 10) } as FormValues<TTipo>,
  });

  const mutation = useMutation({
    mutationFn: onSubmit,
    onSuccess: () => {
      toast.success('Movimiento registrado');
      reset({ tipo: tipoPositivo, monto: 0, fecha: new Date().toISOString().slice(0, 10), descripcion: '' });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: invalidateQueryKey });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const columns: ResponsiveTableColumn<MovimientoCC>[] = [
    { header: 'Fecha', cell: (m) => new Date(m.fecha).toLocaleDateString('es-AR') },
    {
      header: 'Tipo',
      cell: (m) => (
        <Badge tone={m.monto >= 0 ? 'red' : 'green'}>{m.monto >= 0 ? tipoPositivoLabel : tipoNegativoLabel}</Badge>
      ),
    },
    { header: 'Descripción', cell: (m) => m.descripcion ?? '—' },
    { header: 'Monto', cell: (m) => `$ ${Math.abs(m.monto).toLocaleString('es-AR')}` },
    {
      header: 'Saldo',
      cell: (m) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">$ {m.saldo.toLocaleString('es-AR')}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Saldo actual</p>
          <p className={`text-xl font-semibold ${saldo > 0 ? 'text-red-600 dark:text-red-400' : 'text-brand-700 dark:text-brand-300'}`}>
            $ {saldo.toLocaleString('es-AR')}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm((v) => !v)} variant={showForm ? 'secondary' : 'primary'}>
            <PlusIcon className="h-4 w-4" /> {showForm ? 'Cancelar' : 'Nuevo movimiento'}
          </Button>
        )}
      </Card>

      {showForm && (
        <Card>
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <Select label="Tipo" error={errors.tipo?.message as string | undefined} {...register('tipo' as never)}>
              <option value={tipoPositivo}>{tipoPositivoLabel}</option>
              <option value={tipoNegativo}>{tipoNegativoLabel}</option>
            </Select>
            <Input label="Monto ($)" type="number" step="0.01" error={errors.monto?.message} {...register('monto')} />
            <Input label="Fecha" type="date" error={errors.fecha?.message} {...register('fecha')} />
            <Textarea label="Descripción" rows={1} {...register('descripcion')} />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" loading={mutation.isPending}>
                Registrar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Historial</h3>
        {isLoading ? (
          <Spinner />
        ) : !movimientos || movimientos.length === 0 ? (
          <EmptyState title="Sin movimientos registrados" />
        ) : (
          <ResponsiveTable data={movimientos} rowKey={(m) => m.id} columns={columns} />
        )}
      </Card>
    </div>
  );
}
