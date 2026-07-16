import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { proveedoresApi } from '../api/proveedoresApi';
import { Proveedor } from '@/types/insumos';
import { getErrorMessage } from '@/lib/errors';

const schema = z.object({
  empresa: z.string().min(2, 'Requerido'),
  cuit: z.string().min(6, 'Requerido'),
  contacto: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface ProveedorFormModalProps {
  open: boolean;
  onClose: () => void;
  proveedor?: Proveedor | null;
}

export const ProveedorFormModal = ({ open, onClose, proveedor }: ProveedorFormModalProps) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(proveedor);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset(
        proveedor
          ? {
              empresa: proveedor.empresa,
              cuit: proveedor.cuit,
              contacto: proveedor.contacto ?? '',
              direccion: proveedor.direccion ?? '',
              telefono: proveedor.telefono ?? '',
              email: proveedor.email ?? '',
            }
          : { empresa: '', cuit: '', contacto: '', direccion: '', telefono: '', email: '' },
      );
    }
  }, [open, proveedor, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit && proveedor ? proveedoresApi.update(proveedor.id, values) : proveedoresApi.create(values),
    onSuccess: () => {
      toast.success(isEdit ? 'Proveedor actualizado' : 'Proveedor creado');
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <Input label="Empresa" error={errors.empresa?.message} {...register('empresa')} />
        <Input label="CUIT" error={errors.cuit?.message} {...register('cuit')} />
        <Input label="Contacto" {...register('contacto')} />
        <Input label="Dirección" {...register('direccion')} />
        <Input label="Teléfono" {...register('telefono')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? 'Guardar cambios' : 'Crear proveedor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
