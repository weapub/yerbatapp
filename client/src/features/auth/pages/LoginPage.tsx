import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { authApi } from '../api/authApi';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/lib/errors';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type FormValues = z.infer<typeof schema>;

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const { user, ...tokens } = await authApi.login(values.email, values.password);
      setSession(user, tokens);
      const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Credenciales inválidas'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Iniciar sesión</h2>

      <Input
        id="email"
        type="email"
        label="Email"
        placeholder="admin@yerbatapp.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        id="password"
        type="password"
        label="Contraseña"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />

      <Button type="submit" loading={loading} className="w-full">
        Ingresar
      </Button>

      <Link to="/forgot-password" className="text-center text-sm text-brand-700 hover:underline dark:text-brand-300">
        ¿Olvidaste tu contraseña?
      </Link>
    </form>
  );
};
