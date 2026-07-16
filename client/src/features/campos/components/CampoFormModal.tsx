import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Textarea } from '@/components/Textarea';
import { Button } from '@/components/Button';
import { camposApi } from '../api/camposApi';
import { Campo } from '@/types/campos';
import { getErrorMessage } from '@/lib/errors';

const schema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  ubicacion: z.string().min(2, 'Requerido'),
  superficieHa: z.coerce.number().positive('Debe ser mayor a 0'),
  estado: z.enum(['ACTIVO', 'INACTIVO']),
  observaciones: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CampoFormModalProps {
  open: boolean;
  onClose: () => void;
  campo?: Campo | null;
}

export const CampoFormModal = ({ open, onClose, campo }: CampoFormModalProps) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(campo);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { estado: 'ACTIVO' },
  });

  useEffect(() => {
    if (open) {
      reset(
        campo
          ? {
              nombre: campo.nombre,
              ubicacion: campo.ubicacion,
              superficieHa: campo.superficieHa,
              estado: campo.estado,
              observaciones: campo.observaciones ?? '',
            }
          : { nombre: '', ubicacion: '', superficieHa: 0, estado: 'ACTIVO', observaciones: '' },
      );
    }
  }, [open, campo, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => (isEdit && campo ? camposApi.update(campo.id, values) : camposApi.create(values)),
    onSuccess: () => {
      toast.success(isEdit ? 'Campo actualizado' : 'Campo creado');
      queryClient.invalidateQueries({ queryKey: ['campos'] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar campo' : 'Nuevo campo'}>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
        <Input label="Ubicación" error={errors.ubicacion?.message} {...register('ubicacion')} />
        <Input
          label="Superficie (ha)"
          type="number"
          step="0.01"
          error={errors.superficieHa?.message}
          {...register('superficieHa')}
        />
        <Select label="Estado" error={errors.estado?.message} {...register('estado')}>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </Select>
        <Textarea label="Observaciones" rows={3} {...register('observaciones')} />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? 'Guardar cambios' : 'Crear campo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
