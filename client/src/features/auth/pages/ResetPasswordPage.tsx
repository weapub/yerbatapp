import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { authApi } from '../api/authApi';
import { getErrorMessage } from '@/lib/errors';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe incluir una mayúscula')
      .regex(/[0-9]/, 'Debe incluir un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export const ResetPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      toast.error('Enlace inválido: falta el token');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, values.password);
      toast.success('Contraseña actualizada, ya podés iniciar sesión');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error, 'El enlace es inválido o expiró'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Restablecer contraseña</h2>

      <Input
        id="password"
        type="password"
        label="Nueva contraseña"
        error={errors.password?.message}
        {...register('password')}
      />
      <Input
        id="confirmPassword"
        type="password"
        label="Confirmar contraseña"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button type="submit" loading={loading} className="w-full">
        Restablecer
      </Button>

      <Link to="/login" className="text-center text-sm text-brand-700 hover:underline dark:text-brand-300">
        Volver al login
      </Link>
    </form>
  );
};
