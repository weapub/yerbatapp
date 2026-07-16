import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Button } from '@/components/Button';
import { rendimientosApi } from '../api/rendimientosApi';
import { campaniasApi } from '../api/campaniasApi';
import { camposApi } from '@/features/campos/api/camposApi';
import { cultivosApi } from '@/features/cultivos/api/cultivosApi';
import { getErrorMessage } from '@/lib/errors';

const schema = z.object({
  campoId: z.string().min(1, 'Requerido'),
  cultivoId: z.string().min(1, 'Requerido'),
  campaniaId: z.string().min(1, 'Requerido'),
  fecha: z.string().min(1, 'Requerido'),
  produccion: z.coerce.number().positive('Debe ser mayor a 0'),
  unidad: z.enum(['KG', 'TONELADA']),
  costo: z.coerce.number().nonnegative(),
  ingreso: z.coerce.number().nonnegative(),
});

type FormValues = z.infer<typeof schema>;

export const RendimientoFormModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { unidad: 'KG', costo: 0, ingreso: 0 },
  });

  const campoId = watch('campoId');

  useEffect(() => {
    if (open) {
      reset({
        campoId: '',
        cultivoId: '',
        campaniaId: '',
        fecha: new Date().toISOString().slice(0, 10),
        produccion: 0,
        unidad: 'KG',
        costo: 0,
        ingreso: 0,
      });
    }
  }, [open, reset]);

  const { data: campos } = useQuery({
    queryKey: ['campos', { pageSize: 100 }],
    queryFn: () => camposApi.list({ pageSize: 100 }),
    enabled: open,
  });

  const { data: cultivos } = useQuery({
    queryKey: ['cultivos', { campoId, pageSize: 100 }],
    queryFn: () => cultivosApi.list({ campoId, pageSize: 100 }),
    enabled: open && Boolean(campoId),
  });

  const { data: campanias } = useQuery({
    queryKey: ['campanias'],
    queryFn: campaniasApi.list,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => rendimientosApi.create(values),
    onSuccess: () => {
      toast.success('Rendimiento registrado');
      queryClient.invalidateQueries({ queryKey: ['rendimientos'] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Nuevo rendimiento">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <Select label="Campo" error={errors.campoId?.message} {...register('campoId')}>
          <option value="">Seleccionar campo</option>
          {campos?.data.map((campo) => (
            <option key={campo.id} value={campo.id}>
              {campo.nombre}
            </option>
          ))}
        </Select>

        <Select
          label="Cultivo"
          error={errors.cultivoId?.message}
          disabled={!campoId}
          {...register('cultivoId')}
        >
          <option value="">{campoId ? 'Seleccionar cultivo' : 'Elegí primero un campo'}</option>
          {cultivos?.data.map((cultivo) => (
            <option key={cultivo.id} value={cultivo.id}>
              {cultivo.nombre}
            </option>
          ))}
        </Select>

        <Select label="Campaña" error={errors.campaniaId?.message} {...register('campaniaId')}>
          <option value="">Seleccionar campaña</option>
          {campanias?.map((campania) => (
            <option key={campania.id} value={campania.id}>
              {campania.nombre}
            </option>
          ))}
        </Select>

        <Input label="Fecha" type="date" error={errors.fecha?.message} {...register('fecha')} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Producción"
            type="number"
            step="0.01"
            error={errors.produccion?.message}
            {...register('produccion')}
          />
          <Select label="Unidad" {...register('unidad')}>
            <option value="KG">Kilogramos</option>
            <option value="TONELADA">Toneladas</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Costo ($)" type="number" step="0.01" {...register('costo')} />
          <Input label="Ingreso ($)" type="number" step="0.01" {...register('ingreso')} />
        </div>

        <p className="text-xs text-gray-400">El rendimiento por hectárea se calcula automáticamente a partir de la superficie del campo.</p>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Registrar
          </Button>
        </div>
      </form>
    </Modal>
  );
};
