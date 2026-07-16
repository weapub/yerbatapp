import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { authApi } from '../api/authApi';
import { getErrorMessage } from '@/lib/errors';

const schema = z.object({ email: z.string().email('Email inválido') });
type FormValues = z.infer<typeof schema>;

export const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(values.email);
      setSent(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Revisá tu email</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Si el email existe en nuestro sistema, vas a recibir un enlace para restablecer tu contraseña.
        </p>
        <Link to="/login" className="text-sm text-brand-700 hover:underline dark:text-brand-300">
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recuperar contraseña</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <Input
        id="email"
        type="email"
        label="Email"
        placeholder="tu@email.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Button type="submit" loading={loading} className="w-full">
        Enviar enlace
      </Button>

      <Link to="/login" className="text-center text-sm text-brand-700 hover:underline dark:text-brand-300">
        Volver al login
      </Link>
    </form>
  );
};
