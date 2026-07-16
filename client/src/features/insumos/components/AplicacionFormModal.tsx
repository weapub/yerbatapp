import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Textarea } from '@/components/Textarea';
import { Button } from '@/components/Button';
import { insumosApi } from '../api/insumosApi';
import { camposApi } from '@/features/campos/api/camposApi';
import { cultivosApi } from '@/features/cultivos/api/cultivosApi';
import { proveedoresApi } from '@/features/proveedores/api/proveedoresApi';
import { usersApi } from '@/features/users/api/usersApi';
import { getErrorMessage } from '@/lib/errors';
import { TipoInsumo } from '@/types/insumos';

const schema = z.object({
  campoId: z.string().min(1, 'Requerido'),
  cultivoId: z.string().min(1, 'Requerido'),
  proveedorId: z.string().min(1, 'Requerido'),
  productoId: z.string().min(1, 'Requerido'),
  fecha: z.string().min(1, 'Requerido'),
  dosisHa: z.coerce.number().positive('Debe ser mayor a 0'),
  cantidadUtilizada: z.coerce.number().positive('Debe ser mayor a 0'),
  costo: z.coerce.number().nonnegative(),
  aplicadorId: z.string().min(1, 'Requerido'),
  observaciones: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AplicacionFormModalProps {
  open: boolean;
  onClose: () => void;
  tipo: TipoInsumo;
}

const tipoLabel: Record<TipoInsumo, string> = { FERTILIZANTE: 'fertilizante', HERBICIDA: 'herbicida' };

export const AplicacionFormModal = ({ open, onClose, tipo }: AplicacionFormModalProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { costo: 0 } });

  const campoId = watch('campoId');
  const proveedorId = watch('proveedorId');

  useEffect(() => {
    if (open) {
      reset({
        campoId: '',
        cultivoId: '',
        proveedorId: '',
        productoId: '',
        fecha: new Date().toISOString().slice(0, 10),
        dosisHa: 0,
        cantidadUtilizada: 0,
        costo: 0,
        aplicadorId: '',
        observaciones: '',
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

  const { data: proveedores } = useQuery({
    queryKey: ['proveedores', { pageSize: 100 }],
    queryFn: () => proveedoresApi.list({ pageSize: 100 }),
    enabled: open,
  });

  const { data: proveedorDetalle } = useQuery({
    queryKey: ['proveedores', proveedorId],
    queryFn: () => proveedoresApi.getById(proveedorId),
    enabled: open && Boolean(proveedorId),
  });

  const { data: usuarios } = useQuery({ queryKey: ['users'], queryFn: usersApi.list, enabled: open });

  const productosDelTipo = proveedorDetalle?.productos?.filter((p) => p.tipo === tipo) ?? [];

  const mutation = useMutation({
    mutationFn: (values: FormValues) => insumosApi.create(values),
    onSuccess: () => {
      toast.success('Aplicación registrada');
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title={`Nueva aplicación de ${tipoLabel[tipo]}`}>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
        <Select label="Campo" error={errors.campoId?.message} {...register('campoId')}>
          <option value="">Seleccionar campo</option>
          {campos?.data.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>

        <Select label="Cultivo" error={errors.cultivoId?.message} disabled={!campoId} {...register('cultivoId')}>
          <option value="">{campoId ? 'Seleccionar cultivo' : 'Elegí primero un campo'}</option>
          {cultivos?.data.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>

        <Select label="Proveedor" error={errors.proveedorId?.message} {...register('proveedorId')}>
          <option value="">Seleccionar proveedor</option>
          {proveedores?.data.map((p) => (
            <option key={p.id} value={p.id}>
              {p.empresa}
            </option>
          ))}
        </Select>

        <Select
          label="Producto"
          error={errors.productoId?.message}
          disabled={!proveedorId}
          {...register('productoId')}
        >
          <option value="">
            {proveedorId
              ? productosDelTipo.length > 0
                ? 'Seleccionar producto'
                : `Este proveedor no tiene productos de tipo ${tipoLabel[tipo]}`
              : 'Elegí primero un proveedor'}
          </option>
          {productosDelTipo.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} {p.marca && `(${p.marca})`}
            </option>
          ))}
        </Select>

        <Input label="Fecha" type="date" error={errors.fecha?.message} {...register('fecha')} />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Dosis por hectárea"
            type="number"
            step="0.01"
            error={errors.dosisHa?.message}
            {...register('dosisHa')}
          />
          <Input
            label="Cantidad total utilizada"
            type="number"
            step="0.01"
            error={errors.cantidadUtilizada?.message}
            {...register('cantidadUtilizada')}
          />
        </div>

        <Input label="Costo ($)" type="number" step="0.01" {...register('costo')} />

        <Select label="Aplicador" error={errors.aplicadorId?.message} {...register('aplicadorId')}>
          <option value="">Seleccionar responsable</option>
          {usuarios?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </Select>

        <Textarea label="Observaciones" rows={2} {...register('observaciones')} />

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
