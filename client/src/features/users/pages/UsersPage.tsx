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
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth.store';

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
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-400 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Último acceso</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{user.nombre}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge tone="gray">{user.rol}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {user.ultimoAcceso ? new Date(user.ultimoAcceso).toLocaleString('es-AR') : 'Nunca'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={user.activo ? 'green' : 'red'}>{user.activo ? 'Activo' : 'Inactivo'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.activo && user.id !== currentUserId && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`¿Desactivar a ${user.nombre}?`)) deactivateMutation.mutate(user.id);
                        }}
                      >
                        Desactivar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <UserFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
