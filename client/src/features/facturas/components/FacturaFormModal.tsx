import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Button } from '@/components/Button';
import { facturasApi } from '../api/facturasApi';
import { clientesApi } from '@/features/clientes/api/clientesApi';
import { proveedoresApi } from '@/features/proveedores/api/proveedoresApi';
import { getErrorMessage } from '@/lib/errors';

const schema = z
  .object({
    tipo: z.enum(['A', 'B', 'C']),
    operacion: z.enum(['VENTA', 'COMPRA']),
    numero: z.string().min(1, 'Requerido'),
    clienteId: z.string().optional(),
    proveedorId: z.string().optional(),
    fecha: z.string().min(1, 'Requerido'),
    cae: z.string().optional(),
    importeNeto: z.coerce.number().nonnegative(),
    iva: z.coerce.number().nonnegative(),
  })
  .refine((data) => (data.operacion === 'VENTA' ? Boolean(data.clienteId) : true), {
    message: 'Seleccioná un cliente',
    path: ['clienteId'],
  })
  .refine((data) => (data.operacion === 'COMPRA' ? Boolean(data.proveedorId) : true), {
    message: 'Seleccioná un proveedor',
    path: ['proveedorId'],
  });

type FormValues = z.infer<typeof schema>;

export const FacturaFormModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { tipo: 'A', operacion: 'VENTA' } });

  const operacion = watch('operacion');
  const importeNeto = watch('importeNeto');
  const iva = watch('iva');

  useEffect(() => {
    if (open) {
      reset({
        tipo: 'A',
        operacion: 'VENTA',
        numero: '',
        clienteId: '',
        proveedorId: '',
        fecha: new Date().toISOString().slice(0, 10),
        cae: '',
        importeNeto: 0,
        iva: 0,
      });
    }
  }, [open, reset]);

  const { data: clientes } = useQuery({
    queryKey: ['clientes', { pageSize: 100 }],
    queryFn: () => clientesApi.list({ pageSize: 100 }),
    enabled: open && operacion === 'VENTA',
  });

  const { data: proveedores } = useQuery({
    queryKey: ['proveedores', { pageSize: 100 }],
    queryFn: () => proveedoresApi.list({ pageSize: 100 }),
    enabled: open && operacion === 'COMPRA',
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      facturasApi.create({
        ...values,
        clienteId: values.operacion === 'VENTA' ? values.clienteId : undefined,
        proveedorId: values.operacion === 'COMPRA' ? values.proveedorId : undefined,
      }),
    onSuccess: () => {
      toast.success('Factura registrada');
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const total = (Number(importeNeto) || 0) + (Number(iva) || 0);

  return (
    <Modal open={open} onClose={onClose} title="Nueva factura">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Tipo" error={errors.tipo?.message} {...register('tipo')}>
            <option value="A">Factura A</option>
            <option value="B">Factura B</option>
            <option value="C">Factura C</option>
          </Select>
          <Select label="Operación" error={errors.operacion?.message} {...register('operacion')}>
            <option value="VENTA">Venta</option>
            <option value="COMPRA">Compra</option>
          </Select>
        </div>

        <Input label="Número" placeholder="0001-00001234" error={errors.numero?.message} {...register('numero')} />

        {operacion === 'VENTA' ? (
          <Select label="Cliente" error={errors.clienteId?.message} {...register('clienteId')}>
            <option value="">Seleccionar cliente</option>
            {clientes?.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razonSocial}
              </option>
            ))}
          </Select>
        ) : (
          <Select label="Proveedor" error={errors.proveedorId?.message} {...register('proveedorId')}>
            <option value="">Seleccionar proveedor</option>
            {proveedores?.data.map((p) => (
              <option key={p.id} value={p.id}>
                {p.empresa}
              </option>
            ))}
          </Select>
        )}

        <Input label="Fecha" type="date" error={errors.fecha?.message} {...register('fecha')} />
        <Input label="CAE (opcional)" {...register('cae')} />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Importe neto ($)"
            type="number"
            step="0.01"
            error={errors.importeNeto?.message}
            {...register('importeNeto')}
          />
          <Input label="IVA ($)" type="number" step="0.01" error={errors.iva?.message} {...register('iva')} />
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total: <span className="font-semibold text-gray-900 dark:text-gray-100">$ {total.toLocaleString('es-AR')}</span>
        </p>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Registrar factura
          </Button>
        </div>
      </form>
    </Modal>
  );
};
