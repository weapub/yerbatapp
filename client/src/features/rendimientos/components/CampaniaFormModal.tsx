import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { campaniasApi } from '../api/campaniasApi';
import { getErrorMessage } from '@/lib/errors';

const schema = z
  .object({
    nombre: z.string().min(2, 'Requerido'),
    fechaInicio: z.string().min(1, 'Requerido'),
    fechaFin: z.string().min(1, 'Requerido'),
  })
  .refine((data) => data.fechaFin > data.fechaInicio, {
    message: 'Debe ser posterior a la fecha de inicio',
    path: ['fechaFin'],
  });

type FormValues = z.infer<typeof schema>;

export const CampaniaFormModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) reset({ nombre: '', fechaInicio: '', fechaFin: '' });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => campaniasApi.create(values),
    onSuccess: () => {
      toast.success('Campaña creada');
      queryClient.invalidateQueries({ queryKey: ['campanias'] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Nueva campaña">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <Input label="Nombre" placeholder="2025/2026" error={errors.nombre?.message} {...register('nombre')} />
        <Input
          label="Fecha de inicio"
          type="date"
          error={errors.fechaInicio?.message}
          {...register('fechaInicio')}
        />
        <Input label="Fecha de fin" type="date" error={errors.fechaFin?.message} {...register('fechaFin')} />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Crear campaña
          </Button>
        </div>
      </form>
    </Modal>
  );
};
