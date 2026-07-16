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
import { tareasApi } from '../api/tareasApi';
import { camposApi } from '@/features/campos/api/camposApi';
import { cultivosApi } from '@/features/cultivos/api/cultivosApi';
import { usersApi } from '@/features/users/api/usersApi';
import { getErrorMessage } from '@/lib/errors';
import { TIPO_TAREA_LABEL, TipoTarea } from '@/types/tareas';

const TIPO_TAREA_VALUES = Object.keys(TIPO_TAREA_LABEL) as [TipoTarea, ...TipoTarea[]];

const schema = z.object({
  tipo: z.enum(TIPO_TAREA_VALUES),
  campoId: z.string().min(1, 'Requerido'),
  cultivoId: z.string().optional(),
  responsableId: z.string().min(1, 'Requerido'),
  fechaProgramada: z.string().min(1, 'Requerido'),
  prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']),
  observaciones: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export const TareaFormModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { prioridad: 'MEDIA' } });

  const campoId = watch('campoId');

  useEffect(() => {
    if (open) {
      reset({
        tipo: 'DESMALEZADO',
        campoId: '',
        cultivoId: '',
        responsableId: '',
        fechaProgramada: new Date().toISOString().slice(0, 10),
        prioridad: 'MEDIA',
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

  const { data: usuarios } = useQuery({ queryKey: ['users'], queryFn: usersApi.list, enabled: open });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      tareasApi.create({ ...values, cultivoId: values.cultivoId || undefined }),
    onSuccess: () => {
      toast.success('Tarea creada');
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Nueva tarea">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <Select label="Tipo de tarea" error={errors.tipo?.message} {...register('tipo')}>
          {Object.entries(TIPO_TAREA_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select label="Campo" error={errors.campoId?.message} {...register('campoId')}>
          <option value="">Seleccionar campo</option>
          {campos?.data.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>

        <Select label="Cultivo (opcional)" disabled={!campoId} {...register('cultivoId')}>
          <option value="">{campoId ? 'Sin cultivo específico' : 'Elegí primero un campo'}</option>
          {cultivos?.data.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>

        <Select label="Responsable" error={errors.responsableId?.message} {...register('responsableId')}>
          <option value="">Seleccionar responsable</option>
          {usuarios?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </Select>

        <Input
          label="Fecha programada"
          type="date"
          error={errors.fechaProgramada?.message}
          {...register('fechaProgramada')}
        />

        <Select label="Prioridad" error={errors.prioridad?.message} {...register('prioridad')}>
          <option value="BAJA">Baja</option>
          <option value="MEDIA">Media</option>
          <option value="ALTA">Alta</option>
          <option value="URGENTE">Urgente</option>
        </Select>

        <Textarea label="Observaciones" rows={2} {...register('observaciones')} />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Crear tarea
          </Button>
        </div>
      </form>
    </Modal>
  );
};
