import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { finanzasApi } from '../api/finanzasApi';
import { getErrorMessage } from '@/lib/errors';

const schema = z.object({ nombre: z.string().min(2, 'Requerido') });
type FormValues = z.infer<typeof schema>;

export const CentroCostoFormModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) reset({ nombre: '' });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => finanzasApi.createCentroCosto(values),
    onSuccess: () => {
      toast.success('Centro de costo creado');
      queryClient.invalidateQueries({ queryKey: ['finanzas', 'centrosCosto'] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Nuevo centro de costo">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <Input label="Nombre" placeholder="Campo 1" error={errors.nombre?.message} {...register('nombre')} />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Crear
          </Button>
        </div>
      </form>
    </Modal>
  );
};
