import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { clientesApi } from '../api/clientesApi';
import { Cliente } from '@/types/clientes';
import { getErrorMessage } from '@/lib/errors';

const schema = z.object({
  razonSocial: z.string().min(2, 'Requerido'),
  cuit: z.string().min(6, 'Requerido'),
  contacto: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

interface ClienteFormModalProps {
  open: boolean;
  onClose: () => void;
  cliente?: Cliente | null;
}

export const ClienteFormModal = ({ open, onClose, cliente }: ClienteFormModalProps) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(cliente);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset(
        cliente
          ? {
              razonSocial: cliente.razonSocial,
              cuit: cliente.cuit,
              contacto: cliente.contacto ?? '',
              direccion: cliente.direccion ?? '',
              telefono: cliente.telefono ?? '',
              email: cliente.email ?? '',
            }
          : { razonSocial: '', cuit: '', contacto: '', direccion: '', telefono: '', email: '' },
      );
    }
  }, [open, cliente, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit && cliente ? clientesApi.update(cliente.id, values) : clientesApi.create(values),
    onSuccess: () => {
      toast.success(isEdit ? 'Cliente actualizado' : 'Cliente creado');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar cliente' : 'Nuevo cliente'}>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <Input label="Razón social" error={errors.razonSocial?.message} {...register('razonSocial')} />
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
            {isEdit ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
