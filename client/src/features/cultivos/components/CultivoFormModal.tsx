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
import { cultivosApi } from '../api/cultivosApi';
import { Cultivo } from '@/types/campos';
import { getErrorMessage } from '@/lib/errors';

const schema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  variedad: z.string().optional(),
  fechaPlantacion: z.string().min(1, 'Requerido'),
  cantidadPlantas: z.coerce.number().int().positive('Debe ser mayor a 0'),
  estadoSanitario: z.enum(['EXCELENTE', 'BUENO', 'REGULAR', 'MALO']),
  produccionEsperadaKg: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CultivoFormModalProps {
  open: boolean;
  onClose: () => void;
  campoId: string;
  cultivo?: Cultivo | null;
}

export const CultivoFormModal = ({ open, onClose, campoId, cultivo }: CultivoFormModalProps) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(cultivo);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { estadoSanitario: 'BUENO' },
  });

  useEffect(() => {
    if (open) {
      reset(
        cultivo
          ? {
              nombre: cultivo.nombre,
              variedad: cultivo.variedad ?? '',
              fechaPlantacion: cultivo.fechaPlantacion.slice(0, 10),
              cantidadPlantas: cultivo.cantidadPlantas,
              estadoSanitario: cultivo.estadoSanitario,
              produccionEsperadaKg: cultivo.produccionEsperadaKg ?? undefined,
            }
          : {
              nombre: 'Yerba Mate',
              variedad: '',
              fechaPlantacion: new Date().toISOString().slice(0, 10),
              cantidadPlantas: 0,
              estadoSanitario: 'BUENO',
            },
      );
    }
  }, [open, cultivo, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit && cultivo
        ? cultivosApi.update(cultivo.id, values)
        : cultivosApi.create({ ...values, campoId }),
    onSuccess: () => {
      toast.success(isEdit ? 'Cultivo actualizado' : 'Cultivo creado');
      queryClient.invalidateQueries({ queryKey: ['cultivos'] });
      queryClient.invalidateQueries({ queryKey: ['campos', campoId] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar cultivo' : 'Nuevo cultivo'}>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
        <Input label="Variedad" {...register('variedad')} />
        <Input
          label="Fecha de plantación"
          type="date"
          error={errors.fechaPlantacion?.message}
          {...register('fechaPlantacion')}
        />
        <Input
          label="Cantidad de plantas"
          type="number"
          error={errors.cantidadPlantas?.message}
          {...register('cantidadPlantas')}
        />
        <Select label="Estado sanitario" error={errors.estadoSanitario?.message} {...register('estadoSanitario')}>
          <option value="EXCELENTE">Excelente</option>
          <option value="BUENO">Bueno</option>
          <option value="REGULAR">Regular</option>
          <option value="MALO">Malo</option>
        </Select>
        <Input
          label="Producción esperada (kg)"
          type="number"
          step="0.01"
          {...register('produccionEsperadaKg')}
        />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? 'Guardar cambios' : 'Crear cultivo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
