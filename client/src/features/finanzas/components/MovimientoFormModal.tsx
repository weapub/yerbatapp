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
import { finanzasApi } from '../api/finanzasApi';
import { getErrorMessage } from '@/lib/errors';

const schema = z.object({
  cuentaId: z.string().min(1, 'Requerido'),
  categoriaId: z.string().min(1, 'Requerido'),
  centroCostoId: z.string().optional(),
  tipo: z.enum(['INGRESO', 'EGRESO']),
  monto: z.coerce.number().positive('Debe ser mayor a 0'),
  fecha: z.string().min(1, 'Requerido'),
  descripcion: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export const MovimientoFormModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { tipo: 'INGRESO' } });

  const tipo = watch('tipo');

  useEffect(() => {
    if (open) {
      reset({
        cuentaId: '',
        categoriaId: '',
        centroCostoId: '',
        tipo: 'INGRESO',
        monto: 0,
        fecha: new Date().toISOString().slice(0, 10),
        descripcion: '',
      });
    }
  }, [open, reset]);

  const { data: cuentas } = useQuery({ queryKey: ['finanzas', 'cuentas'], queryFn: finanzasApi.listCuentas, enabled: open });
  const { data: categorias } = useQuery({
    queryKey: ['finanzas', 'categorias'],
    queryFn: finanzasApi.listCategorias,
    enabled: open,
  });
  const { data: centros } = useQuery({
    queryKey: ['finanzas', 'centrosCosto'],
    queryFn: finanzasApi.listCentrosCosto,
    enabled: open,
  });

  const categoriasDelTipo = categorias?.filter((c) => c.tipo === tipo) ?? [];

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      finanzasApi.createMovimiento({ ...values, centroCostoId: values.centroCostoId || undefined }),
    onSuccess: () => {
      toast.success('Movimiento registrado');
      queryClient.invalidateQueries({ queryKey: ['finanzas'] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Nuevo movimiento">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <Select label="Tipo" error={errors.tipo?.message} {...register('tipo')}>
          <option value="INGRESO">Ingreso</option>
          <option value="EGRESO">Egreso</option>
        </Select>

        <Select label="Cuenta" error={errors.cuentaId?.message} {...register('cuentaId')}>
          <option value="">Seleccionar cuenta</option>
          {cuentas?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>

        <Select label="Categoría" error={errors.categoriaId?.message} {...register('categoriaId')}>
          <option value="">
            {categoriasDelTipo.length > 0 ? 'Seleccionar categoría' : `Sin categorías de tipo ${tipo}`}
          </option>
          {categoriasDelTipo.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>

        <Select label="Centro de costo (opcional)" {...register('centroCostoId')}>
          <option value="">Sin centro de costo</option>
          {centros?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>

        <Input label="Monto ($)" type="number" step="0.01" error={errors.monto?.message} {...register('monto')} />
        <Input label="Fecha" type="date" error={errors.fecha?.message} {...register('fecha')} />
        <Textarea label="Descripción" rows={2} {...register('descripcion')} />

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
