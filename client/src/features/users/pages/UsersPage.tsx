import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PlusIcon, UsersIcon } from '@heroicons/react/24/outline';
import { usersApi } from '../api/usersApi';
import { UserFormModal } from '../components/UserFormModal';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { FullPageSpinner } from '@/components/Spinner';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ResponsiveTable';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth.store';
import { SafeUser } from '@/types/auth';

export const UsersPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      toast.success('Usuario desactivado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const columns: ResponsiveTableColumn<SafeUser>[] = [
    { header: 'Nombre', cell: (user) => <span className="font-medium text-gray-900 dark:text-gray-100">{user.nombre}</span> },
    { header: 'Email', cell: (user) => user.email },
    { header: 'Rol', cell: (user) => <Badge tone="gray">{user.rol}</Badge> },
    {
      header: 'Último acceso',
      cell: (user) => (user.ultimoAcceso ? new Date(user.ultimoAcceso).toLocaleString('es-AR') : 'Nunca'),
    },
    {
      header: 'Estado',
      cell: (user) => <Badge tone={user.activo ? 'green' : 'red'}>{user.activo ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      header: '',
      actions: true,
      cell: (user) =>
        user.activo &&
        user.id !== currentUserId && (
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm(`¿Desactivar a ${user.nombre}?`)) deactivateMutation.mutate(user.id);
            }}
          >
            Desactivar
          </Button>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Usuarios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Administración de usuarios, roles y accesos</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <PlusIcon className="h-4 w-4" /> Nuevo usuario
        </Button>
      </div>

      {isLoading ? (
        <FullPageSpinner />
      ) : !users || users.length === 0 ? (
        <EmptyState icon={<UsersIcon className="h-10 w-10" />} title="No hay usuarios cargados" />
      ) : (
        <Card className="p-3 sm:p-0">
          <ResponsiveTable data={users} rowKey={(user) => user.id} columns={columns} />
        </Card>
      )}

      <UserFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
