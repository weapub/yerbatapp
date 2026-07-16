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

const schema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  tipo: z.enum(['CAJA', 'BANCO']),
  saldoInicial: z.coerce.number(),
});
type FormValues = z.infer<typeof schema>;

export const CuentaFormModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { tipo: 'CAJA', saldoInicial: 0 } });

  useEffect(() => {
    if (open) reset({ nombre: '', tipo: 'CAJA', saldoInicial: 0 });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => finanzasApi.createCuenta(values),
    onSuccess: () => {
      toast.success('Cuenta creada');
      queryClient.invalidateQueries({ queryKey: ['finanzas', 'cuentas'] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Nueva cuenta">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <Input label="Nombre" placeholder="Caja principal" error={errors.nombre?.message} {...register('nombre')} />
        <Select label="Tipo" error={errors.tipo?.message} {...register('tipo')}>
          <option value="CAJA">Caja</option>
          <option value="BANCO">Banco</option>
        </Select>
        <Input label="Saldo inicial ($)" type="number" step="0.01" {...register('saldoInicial')} />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Crear cuenta
          </Button>
        </div>
      </form>
    </Modal>
  );
};
