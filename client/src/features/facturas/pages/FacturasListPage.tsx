import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { DocumentTextIcon, PaperClipIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { facturasApi } from '../api/facturasApi';
import { FacturaFormModal } from '../components/FacturaFormModal';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Select } from '@/components/Select';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { FullPageSpinner } from '@/components/Spinner';
import { getErrorMessage } from '@/lib/errors';
import { resolveFileUrl } from '@/lib/url';
import { useAuthStore } from '@/store/auth.store';
import { EstadoFactura, TipoOperacionFactura } from '@/types/facturas';

const ESTADO_TONE: Record<EstadoFactura, 'green' | 'yellow' | 'red' | 'gray'> = {
  PAGADA: 'green',
  PENDIENTE: 'yellow',
  VENCIDA: 'red',
  ANULADA: 'gray',
};

export const FacturasListPage = () => {
  const [page, setPage] = useState(1);
  const [operacion, setOperacion] = useState<TipoOperacionFactura | ''>('');
  const [estado, setEstado] = useState<EstadoFactura | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const rol = useAuthStore((s) => s.user?.rol);
  const canManage = rol === 'ADMIN' || rol === 'SUPERVISOR';
  const canDelete = rol === 'ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['facturas', { page, operacion, estado }],
    queryFn: () =>
      facturasApi.list({ page, pageSize: 10, operacion: operacion || undefined, estado: estado || undefined }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['facturas'] });

  const updateMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoFactura }) => facturasApi.update(id, { estado }),
    onSuccess: () => {
      toast.success('Factura actualizada');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: facturasApi.delete,
    onSuccess: () => {
      toast.success('Factura eliminada');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const adjuntoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => facturasApi.addAdjunto(id, file),
    onSuccess: () => {
      toast.success('Adjunto agregado');
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

  return (
    <div className="flex flex-col gap-6">
      <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileChange} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Facturas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Facturación de ventas y compras</p>
        </div>
        {canManage && (
          <Button onClick={() => setModalOpen(true)}>
            <PlusIcon className="h-4 w-4" /> Nueva factura
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          className="w-44"
          value={operacion}
          onChange={(e) => {
            setOperacion(e.target.value as TipoOperacionFactura | '');
            setPage(1);
          }}
        >
          <option value="">Todas las operaciones</option>
          <option value="VENTA">Ventas</option>
          <option value="COMPRA">Compras</option>
        </Select>
        <Select
          className="w-44"
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value as EstadoFactura | '');
            setPage(1);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="PAGADA">Pagada</option>
          <option value="VENCIDA">Vencida</option>
          <option value="ANULADA">Anulada</option>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <FullPageSpinner />
        ) : !data || data.data.length === 0 ? (
          <EmptyState icon={<DocumentTextIcon className="h-10 w-10" />} title="No hay facturas registradas" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase text-gray-400 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Número</th>
                    <th className="px-4 py-3 font-medium">Cliente/Proveedor</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.data.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {new Date(f.fecha).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        Factura {f.tipo} · {f.operacion === 'VENTA' ? 'Venta' : 'Compra'}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{f.numero}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {f.cliente?.razonSocial ?? f.proveedor?.empresa ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        $ {f.total.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3">
                        {canManage && f.estado !== 'ANULADA' ? (
                          <Select
                            className="w-32 py-1 text-xs"
                            value={f.estado}
                            onChange={(e) => updateMutation.mutate({ id: f.id, estado: e.target.value as EstadoFactura })}
                          >
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="PAGADA">Pagada</option>
                            <option value="VENCIDA">Vencida</option>
                            <option value="ANULADA">Anulada</option>
                          </Select>
                        ) : (
                          <Badge tone={ESTADO_TONE[f.estado]}>{f.estado}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setUploadingId(f.id);
                              fileInputRef.current?.click();
                            }}
                            loading={adjuntoMutation.isPending && uploadingId === f.id}
                            title={f.adjuntos.length > 0 ? `${f.adjuntos.length} adjunto(s)` : 'Adjuntar PDF/imagen'}
                          >
                            <PaperClipIcon className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                if (confirm('¿Eliminar esta factura?')) deleteMutation.mutate(f.id);
                              }}
                            >
                              <TrashIcon className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                        {f.adjuntos.length > 0 && (
                          <div className="mt-1 flex flex-wrap justify-end gap-1">
                            {f.adjuntos.map((a) => (
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>
                Página {data.meta.page} de {data.meta.totalPages} · {data.meta.total} facturas
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

      <FacturaFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
