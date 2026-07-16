import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, MapIcon, PlusIcon } from '@heroicons/react/24/outline';
import { camposApi } from '../api/camposApi';
import { CampoFormModal } from '../components/CampoFormModal';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FullPageSpinner } from '@/components/Spinner';
import { useAuthStore } from '@/store/auth.store';

export const CamposListPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<'ACTIVO' | 'INACTIVO' | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const rol = useAuthStore((s) => s.user?.rol);
  const canManage = rol === 'ADMIN' || rol === 'SUPERVISOR';

  const { data, isLoading } = useQuery({
    queryKey: ['campos', { page, search, estado }],
    queryFn: () =>
      camposApi.list({ page, pageSize: 12, search: search || undefined, estado: estado || undefined }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Campos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Establecimientos de la empresa</p>
        </div>
        {canManage && (
          <Button onClick={() => setModalOpen(true)}>
            <PlusIcon className="h-4 w-4" /> Nuevo campo
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full sm:w-64">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o ubicación"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          className="w-40"
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value as typeof estado);
            setPage(1);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </Select>
      </div>

      {isLoading ? (
        <FullPageSpinner />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={<MapIcon className="h-10 w-10" />}
          title="No hay campos cargados todavía"
          description="Creá el primer campo para empezar a registrar cultivos, tareas y producción."
          action={
            canManage && (
              <Button onClick={() => setModalOpen(true)}>
                <PlusIcon className="h-4 w-4" /> Nuevo campo
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((campo) => (
              <Link key={campo.id} to={`/campos/${campo.id}`}>
                <Card className="flex h-full flex-col gap-3 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{campo.nombre}</h3>
                    <Badge tone={campo.estado === 'ACTIVO' ? 'green' : 'gray'}>{campo.estado}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{campo.ubicacion}</p>
                  <div className="mt-auto flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>{campo.superficieHa.toLocaleString('es-AR')} ha</span>
                    <span>{campo._count?.cultivos ?? 0} cultivos</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Página {data.meta.page} de {data.meta.totalPages} · {data.meta.total} campos
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

      <CampoFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
