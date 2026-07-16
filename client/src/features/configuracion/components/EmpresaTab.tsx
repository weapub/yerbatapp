import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { configuracionApi } from '../api/configuracionApi';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { FullPageSpinner } from '@/components/Spinner';
import { getErrorMessage } from '@/lib/errors';
import { resolveFileUrl } from '@/lib/url';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  razonSocial: z.string().min(2, 'Requerido'),
  cuit: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  ivaGeneral: z.coerce.number().min(0).max(100),
});
type FormValues = z.infer<typeof schema>;

export const EmpresaTab = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rol = useAuthStore((s) => s.user?.rol);
  const canManage = rol === 'ADMIN';

  const { data, isLoading } = useQuery({ queryKey: ['configuracion', 'empresa'], queryFn: configuracionApi.getEmpresa });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data) {
      reset({
        razonSocial: data.razonSocial,
        cuit: data.cuit ?? '',
        direccion: data.direccion ?? '',
        telefono: data.telefono ?? '',
        ivaGeneral: data.ivaGeneral,
      });
    }
  }, [data, reset]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['configuracion', 'empresa'] });

  const updateMutation = useMutation({
    mutationFn: configuracionApi.updateEmpresa,
    onSuccess: () => {
      toast.success('Datos de la empresa actualizados');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const logoMutation = useMutation({
    mutationFn: configuracionApi.uploadLogo,
    onSuccess: () => {
      toast.success('Logo actualizado');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="flex flex-col items-center gap-3 lg:col-span-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) logoMutation.mutate(file);
            e.target.value = '';
          }}
        />
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
          {data?.logoUrl ? (
            <img src={resolveFileUrl(data.logoUrl)} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <PhotoIcon className="h-10 w-10 text-gray-400" />
          )}
        </div>
        {canManage && (
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            loading={logoMutation.isPending}
          >
            Cambiar logo
          </Button>
        )}
      </Card>

      <Card className="lg:col-span-2">
        <form
          onSubmit={handleSubmit((values) => updateMutation.mutate(values))}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Input
            label="Razón social"
            className="sm:col-span-2"
            error={errors.razonSocial?.message}
            disabled={!canManage}
            {...register('razonSocial')}
          />
          <Input label="CUIT" disabled={!canManage} {...register('cuit')} />
          <Input label="Teléfono" disabled={!canManage} {...register('telefono')} />
          <Input label="Dirección" className="sm:col-span-2" disabled={!canManage} {...register('direccion')} />
          <Input
            label="IVA general (%)"
            type="number"
            step="0.01"
            error={errors.ivaGeneral?.message}
            disabled={!canManage}
            {...register('ivaGeneral')}
          />

          {canManage && (
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" loading={updateMutation.isPending}>
                Guardar cambios
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};
