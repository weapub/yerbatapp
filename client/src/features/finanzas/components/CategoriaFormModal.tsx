import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Button } from '@/components/Button';
import { finanzasApi } from '../api/finanzasApi';
import { getErrorMessage } from '@/lib/errors';

const schema = z.object({ nombre: z.string().min(2, 'Requerido'), tipo: z.enum(['INGRESO', 'EGRESO']) });
type FormValues = z.infer<typeof schema>;

export const CategoriaFormModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { tipo: 'INGRESO' } });

  useEffect(() => {
    if (open) reset({ nombre: '', tipo: 'INGRESO' });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => finanzasApi.createCategoria(values),
    onSuccess: () => {
      toast.success('Categoría creada');
      queryClient.invalidateQueries({ queryKey: ['finanzas', 'categorias'] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Nueva categoría">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <Input label="Nombre" placeholder="Venta de yerba" error={errors.nombre?.message} {...register('nombre')} />
        <Select label="Tipo" error={errors.tipo?.message} {...register('tipo')}>
          <option value="INGRESO">Ingreso</option>
          <option value="EGRESO">Egreso</option>
        </Select>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Crear categoría
          </Button>
        </div>
      </form>
    </Modal>
  );
};
