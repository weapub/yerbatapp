import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Button } from '@/components/Button';
import { usersApi } from '../api/usersApi';
import { getErrorMessage } from '@/lib/errors';

const schema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula')
    .regex(/[0-9]/, 'Debe incluir un número'),
  rol: z.enum(['ADMIN', 'SUPERVISOR', 'EMPLEADO']),
});
type FormValues = z.infer<typeof schema>;

export const UserFormModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { rol: 'EMPLEADO' } });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => usersApi.create(values),
    onSuccess: () => {
      toast.success('Usuario creado');
      reset();
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Nuevo usuario">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input
          label="Contraseña temporal"
          type="password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Select label="Rol" error={errors.rol?.message} {...register('rol')}>
          <option value="ADMIN">Administrador</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="EMPLEADO">Empleado</option>
        </Select>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Crear usuario
          </Button>
        </div>
      </form>
    </Modal>
  );
};
