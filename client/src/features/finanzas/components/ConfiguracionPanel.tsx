import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { finanzasApi } from '../api/finanzasApi';
import { CuentaFormModal } from './CuentaFormModal';
import { CategoriaFormModal } from './CategoriaFormModal';
import { CentroCostoFormModal } from './CentroCostoFormModal';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { getErrorMessage } from '@/lib/errors';

export const ConfiguracionPanel = () => {
  const queryClient = useQueryClient();
  const [cuentaModal, setCuentaModal] = useState(false);
  const [categoriaModal, setCategoriaModal] = useState(false);
  const [centroModal, setCentroModal] = useState(false);

  const { data: cuentas, isLoading: cuentasLoading } = useQuery({
    queryKey: ['finanzas', 'cuentas'],
    queryFn: finanzasApi.listCuentas,
  });
  const { data: categorias, isLoading: categoriasLoading } = useQuery({
    queryKey: ['finanzas', 'categorias'],
    queryFn: finanzasApi.listCategorias,
  });
  const { data: centros, isLoading: centrosLoading } = useQuery({
    queryKey: ['finanzas', 'centrosCosto'],
    queryFn: finanzasApi.listCentrosCosto,
  });

  const deleteCuenta = useMutation({
    mutationFn: finanzasApi.deleteCuenta,
    onSuccess: () => {
      toast.success('Cuenta eliminada');
      queryClient.invalidateQueries({ queryKey: ['finanzas', 'cuentas'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const deleteCategoria = useMutation({
    mutationFn: finanzasApi.deleteCategoria,
    onSuccess: () => {
      toast.success('Categoría eliminada');
      queryClient.invalidateQueries({ queryKey: ['finanzas', 'categorias'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const deleteCentro = useMutation({
    mutationFn: finanzasApi.deleteCentroCosto,
    onSuccess: () => {
      toast.success('Centro de costo eliminado');
      queryClient.invalidateQueries({ queryKey: ['finanzas', 'centrosCosto'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cuentas</h3>
          <Button variant="ghost" onClick={() => setCuentaModal(true)}>
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
        {cuentasLoading ? (
          <Spinner />
        ) : !cuentas || cuentas.length === 0 ? (
          <EmptyState title="Sin cuentas" />
        ) : (
          <ul className="flex flex-col gap-2">
            {cuentas.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{c.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {c.tipo} · saldo $ {c.saldoActual.toLocaleString('es-AR')}
                  </p>
                </div>
                <button onClick={() => deleteCuenta.mutate(c.id)} className="text-gray-400 hover:text-red-500">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Categorías</h3>
          <Button variant="ghost" onClick={() => setCategoriaModal(true)}>
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
        {categoriasLoading ? (
          <Spinner />
        ) : !categorias || categorias.length === 0 ? (
          <EmptyState title="Sin categorías" />
        ) : (
          <ul className="flex flex-col gap-2">
            {categorias.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-gray-100">{c.nombre}</span>
                  <Badge tone={c.tipo === 'INGRESO' ? 'green' : 'red'}>{c.tipo}</Badge>
                </div>
                <button onClick={() => deleteCategoria.mutate(c.id)} className="text-gray-400 hover:text-red-500">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Centros de costo</h3>
          <Button variant="ghost" onClick={() => setCentroModal(true)}>
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
        {centrosLoading ? (
          <Spinner />
        ) : !centros || centros.length === 0 ? (
          <EmptyState title="Sin centros de costo" />
        ) : (
          <ul className="flex flex-col gap-2">
            {centros.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
                <span className="text-gray-900 dark:text-gray-100">{c.nombre}</span>
                <button onClick={() => deleteCentro.mutate(c.id)} className="text-gray-400 hover:text-red-500">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <CuentaFormModal open={cuentaModal} onClose={() => setCuentaModal(false)} />
      <CategoriaFormModal open={categoriaModal} onClose={() => setCategoriaModal(false)} />
      <CentroCostoFormModal open={centroModal} onClose={() => setCentroModal(false)} />
    </div>
  );
};
