import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { clientesApi } from '../api/clientesApi';
import { ClienteFormModal } from '../components/ClienteFormModal';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { FullPageSpinner } from '@/components/Spinner';
import { useAuthStore } from '@/store/auth.store';

export const ClientesListPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const rol = useAuthStore((s) => s.user?.rol);
  const canManage = rol === 'ADMIN' || rol === 'SUPERVISOR';

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', { page, search }],
    queryFn: () => clientesApi.list({ page, pageSize: 12, search: search || undefined }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Clientes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Clientes y cuenta corriente</p>
        </div>
        {canManage && (
          <Button onClick={() => setModalOpen(true)}>
            <PlusIcon className="h-4 w-4" /> Nuevo cliente
          </Button>
        )}
      </div>

      <div className="relative w-full sm:w-72">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por razón social o CUIT"
          className="pl-9"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <FullPageSpinner />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={<UserGroupIcon className="h-10 w-10" />}
          title="No hay clientes cargados todavía"
          action={
            canManage && (
              <Button onClick={() => setModalOpen(true)}>
                <PlusIcon className="h-4 w-4" /> Nuevo cliente
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((cliente) => (
              <Link key={cliente.id} to={`/clientes/${cliente.id}`}>
                <Card className="flex h-full flex-col gap-2 transition-shadow hover:shadow-md">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{cliente.razonSocial}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">CUIT {cliente.cuit}</p>
                  <div className="mt-auto flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Ventas $ {cliente.totalVentas.toLocaleString('es-AR')}
                    </span>
                    <Badge tone={cliente.saldo > 0 ? 'red' : 'green'}>
                      Saldo $ {cliente.saldo.toLocaleString('es-AR')}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Página {data.meta.page} de {data.meta.totalPages} · {data.meta.total} clientes
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button
                variant="secondary"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}

      <ClienteFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
