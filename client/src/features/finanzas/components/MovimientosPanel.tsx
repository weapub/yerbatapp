import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BanknotesIcon, PaperClipIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { finanzasApi } from '../api/finanzasApi';
import { MovimientoFormModal } from './MovimientoFormModal';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Select } from '@/components/Select';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { FullPageSpinner } from '@/components/Spinner';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ResponsiveTable';
import { getErrorMessage } from '@/lib/errors';
import { resolveFileUrl } from '@/lib/url';
import { useAuthStore } from '@/store/auth.store';
import { MovimientoFinanciero, TipoMovimientoFinanciero } from '@/types/finanzas';

export const MovimientosPanel = () => {
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState<TipoMovimientoFinanciero | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const rol = useAuthStore((s) => s.user?.rol);
  const canManage = rol === 'ADMIN' || rol === 'SUPERVISOR';
  const canDelete = rol === 'ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['finanzas', 'movimientos', { page, tipo }],
    queryFn: () => finanzasApi.listMovimientos({ page, pageSize: 10, tipo: tipo || undefined }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['finanzas'] });

  const deleteMutation = useMutation({
    mutationFn: finanzasApi.deleteMovimiento,
    onSuccess: () => {
      toast.success('Movimiento eliminado');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const adjuntoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => finanzasApi.addAdjunto(id, file),
    onSuccess: () => {
      toast.success('Comprobante adjuntado');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => setUploadingId(null),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingId) adjuntoMutation.mutate({ id: uploadingId, file });
    e.target.value = '';
  };

  const columns: ResponsiveTableColumn<MovimientoFinanciero>[] = [
    { header: 'Fecha', cell: (m) => new Date(m.fecha).toLocaleDateString('es-AR') },
    { header: 'Tipo', cell: (m) => <Badge tone={m.tipo === 'INGRESO' ? 'green' : 'red'}>{m.tipo}</Badge> },
    { header: 'Cuenta', cell: (m) => m.cuenta.nombre },
    { header: 'Categoría', cell: (m) => m.categoria.nombre },
    { header: 'Descripción', cell: (m) => m.descripcion ?? '—' },
    {
      header: 'Monto',
      cell: (m) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">$ {m.monto.toLocaleString('es-AR')}</span>
      ),
    },
    {
      header: '',
      actions: true,
      cell: (m) => (
        <div className="flex flex-col items-end gap-1">
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              onClick={() => {
                setUploadingId(m.id);
                fileInputRef.current?.click();
              }}
              loading={adjuntoMutation.isPending && uploadingId === m.id}
              title={m.adjuntos.length > 0 ? `${m.adjuntos.length} adjunto(s)` : 'Adjuntar comprobante'}
            >
              <PaperClipIcon className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (confirm('¿Eliminar este movimiento?')) deleteMutation.mutate(m.id);
                }}
              >
                <TrashIcon className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
          {m.adjuntos.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1">
              {m.adjuntos.map((a) => (
                <a
                  key={a.id}
                  href={resolveFileUrl(a.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-700 hover:underline dark:text-brand-300"
                >
                  {a.nombreArchivo}
                </a>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          className="w-48"
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value as TipoMovimientoFinanciero | '');
            setPage(1);
          }}
        >
          <option value="">Todos los movimientos</option>
          <option value="INGRESO">Ingresos</option>
          <option value="EGRESO">Egresos</option>
        </Select>
        {canManage && (
          <Button onClick={() => setModalOpen(true)}>
            <PlusIcon className="h-4 w-4" /> Nuevo movimiento
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <FullPageSpinner />
        ) : !data || data.data.length === 0 ? (
          <EmptyState icon={<BanknotesIcon className="h-10 w-10" />} title="No hay movimientos registrados" />
        ) : (
          <>
            <ResponsiveTable data={data.data} rowKey={(m) => m.id} columns={columns} />

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>
                Página {data.meta.page} de {data.meta.totalPages} · {data.meta.total} movimientos
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
      </Card>

      <MovimientoFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
