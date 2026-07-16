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
import { proveedoresApi } from '../api/proveedoresApi';
import { getErrorMessage } from '@/lib/errors';

const schema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  marca: z.string().optional(),
  tipo: z.enum(['FERTILIZANTE', 'HERBICIDA']),
});
type FormValues = z.infer<typeof schema>;

interface ProductoFormModalProps {
  open: boolean;
  onClose: () => void;
  proveedorId: string;
}

export const ProductoFormModal = ({ open, onClose, proveedorId }: ProductoFormModalProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { tipo: 'FERTILIZANTE' } });

  useEffect(() => {
    if (open) reset({ nombre: '', marca: '', tipo: 'FERTILIZANTE' });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => proveedoresApi.createProducto(proveedorId, values),
    onSuccess: () => {
      toast.success('Producto agregado');
      queryClient.invalidateQueries({ queryKey: ['proveedores', proveedorId] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Nuevo producto">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <Input label="Nombre" placeholder="Urea 46%" error={errors.nombre?.message} {...register('nombre')} />
        <Input label="Marca" {...register('marca')} />
        <Select label="Tipo" error={errors.tipo?.message} {...register('tipo')}>
          <option value="FERTILIZANTE">Fertilizante</option>
          <option value="HERBICIDA">Herbicida</option>
        </Select>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Agregar producto
          </Button>
        </div>
      </form>
    </Modal>
  );
};
