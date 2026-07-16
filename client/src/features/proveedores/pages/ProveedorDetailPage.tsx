import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { proveedoresApi } from '../api/proveedoresApi';
import { ProveedorFormModal } from '../components/ProveedorFormModal';
import { ProductoFormModal } from '../components/ProductoFormModal';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { FullPageSpinner } from '@/components/Spinner';
import { CuentaCorrientePanel } from '@/components/CuentaCorrientePanel';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ResponsiveTable';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth.store';
import { HistorialAplicacion } from '@/types/insumos';

export const ProveedorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [productoModalOpen, setProductoModalOpen] = useState(false);
  const rol = useAuthStore((s) => s.user?.rol);
  const canManage = rol === 'ADMIN' || rol === 'SUPERVISOR';
  const canDelete = rol === 'ADMIN';

  const { data: proveedor, isLoading } = useQuery({
    queryKey: ['proveedores', id],
    queryFn: () => proveedoresApi.getById(id as string),
    enabled: Boolean(id),
  });

  const { data: historial, isLoading: historialLoading } = useQuery({
    queryKey: ['proveedores', id, 'historial'],
    queryFn: () => proveedoresApi.historial(id as string),
    enabled: Boolean(id),
  });

  const { data: movimientosCC, isLoading: movimientosCCLoading } = useQuery({
    queryKey: ['proveedores', id, 'cuenta-corriente'],
    queryFn: () => proveedoresApi.listMovimientosCC(id as string),
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => proveedoresApi.delete(id as string),
    onSuccess: () => {
      toast.success('Proveedor eliminado');
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      navigate('/proveedores');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const historialColumns: ResponsiveTableColumn<HistorialAplicacion>[] = [
    { header: 'Fecha', cell: (h) => new Date(h.fecha).toLocaleDateString('es-AR') },
    {
      header: 'Producto',
      cell: (h) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {h.producto} {h.marca && `(${h.marca})`}
        </span>
      ),
    },
    { header: 'Campo', cell: (h) => h.campo },
    { header: 'Cultivo', cell: (h) => h.cultivo },
    { header: 'Cantidad', cell: (h) => h.cantidadUtilizada.toLocaleString('es-AR') },
    { header: 'Costo', cell: (h) => `$ ${h.costo.toLocaleString('es-AR')}` },
  ];

  if (isLoading || !proveedor) return <FullPageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate('/proveedores')}
        className="flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Volver a proveedores
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{proveedor.empresa}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            CUIT {proveedor.cuit} {proveedor.telefono && `· ${proveedor.telefono}`} {proveedor.email && `· ${proveedor.email}`}
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
                  if (confirm(`¿Eliminar el proveedor "${proveedor.empresa}"?`)) deleteMutation.mutate();
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Productos vendidos</h2>
          {canManage && (
            <Button variant="secondary" onClick={() => setProductoModalOpen(true)}>
              <PlusIcon className="h-4 w-4" /> Agregar producto
            </Button>
          )}
        </div>
        {!proveedor.productos || proveedor.productos.length === 0 ? (
          <EmptyState title="Sin productos cargados" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {proveedor.productos.map((producto) => (
              <Badge key={producto.id} tone={producto.tipo === 'FERTILIZANTE' ? 'green' : 'yellow'}>
                {producto.nombre} {producto.marca && `(${producto.marca})`} · {producto.tipo}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Historial de aplicaciones</h2>
        {historialLoading ? (
          <FullPageSpinner />
        ) : !historial || historial.length === 0 ? (
          <EmptyState title="Sin historial todavía" description="Se muestran las aplicaciones registradas con productos de este proveedor." />
        ) : (
          <ResponsiveTable data={historial} rowKey={(h) => h.id} columns={historialColumns} />
        )}
      </Card>

      <CuentaCorrientePanel
        saldo={proveedor.saldo}
        movimientos={movimientosCC}
        isLoading={movimientosCCLoading}
        canManage={canManage}
        tipoPositivo="COMPRA"
        tipoPositivoLabel="Compra"
        tipoNegativo="PAGO"
        tipoNegativoLabel="Pago"
        invalidateQueryKey={['proveedores', id]}
        onSubmit={(values) => proveedoresApi.registrarMovimientoCC(id as string, values)}
      />

      <ProveedorFormModal open={editOpen} onClose={() => setEditOpen(false)} proveedor={proveedor} />
      <ProductoFormModal
        open={productoModalOpen}
        onClose={() => setProductoModalOpen(false)}
        proveedorId={proveedor.id}
      />
    </div>
  );
};
