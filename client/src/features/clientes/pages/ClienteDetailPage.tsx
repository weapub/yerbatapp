import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { clientesApi } from '../api/clientesApi';
import { ClienteFormModal } from '../components/ClienteFormModal';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FullPageSpinner } from '@/components/Spinner';
import { CuentaCorrientePanel } from '@/components/CuentaCorrientePanel';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth.store';

export const ClienteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const rol = useAuthStore((s) => s.user?.rol);
  const canManage = rol === 'ADMIN' || rol === 'SUPERVISOR';
  const canDelete = rol === 'ADMIN';

  const { data: cliente, isLoading } = useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clientesApi.getById(id as string),
    enabled: Boolean(id),
  });

  const { data: movimientos, isLoading: movimientosLoading } = useQuery({
    queryKey: ['clientes', id, 'cuenta-corriente'],
    queryFn: () => clientesApi.listMovimientosCC(id as string),
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => clientesApi.delete(id as string),
    onSuccess: () => {
      toast.success('Cliente eliminado');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      navigate('/clientes');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (isLoading || !cliente) return <FullPageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate('/clientes')}
        className="flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Volver a clientes
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{cliente.razonSocial}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            CUIT {cliente.cuit} {cliente.telefono && `· ${cliente.telefono}`} {cliente.email && `· ${cliente.email}`}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <PencilSquareIcon className="h-4 w-4" /> Editar
            </Button>
            {canDelete && (
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm(`¿Eliminar el cliente "${cliente.razonSocial}"?`)) deleteMutation.mutate();
                }}
                loading={deleteMutation.isPending}
              >
                <TrashIcon className="h-4 w-4" /> Eliminar
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <p className="text-xs text-gray-400">Total de ventas históricas</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          $ {cliente.totalVentas.toLocaleString('es-AR')}
        </p>
      </Card>

      <CuentaCorrientePanel
        saldo={cliente.saldo}
        movimientos={movimientos}
        isLoading={movimientosLoading}
        canManage={canManage}
        tipoPositivo="VENTA"
        tipoPositivoLabel="Venta"
        tipoNegativo="COBRO"
        tipoNegativoLabel="Cobro"
        invalidateQueryKey={['clientes', id]}
        onSubmit={(values) => clientesApi.registrarMovimientoCC(id as string, values)}
      />

      <ClienteFormModal open={editOpen} onClose={() => setEditOpen(false)} cliente={cliente} />
    </div>
  );
};
