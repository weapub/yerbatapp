import { ReactNode } from 'react';
import clsx from 'clsx';

export interface ResponsiveTableColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  /** Clase para el <th>/<td> en la vista de escritorio (ancho, alineación, etc.). */
  className?: string;
  /**
   * Columnas de acciones (botones) no se muestran como fila "ETIQUETA: valor"
   * en la tarjeta mobile — se agrupan al pie, alineadas a la derecha.
   */
  actions?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: ResponsiveTableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  rowClassName?: string;
}

/**
 * Tabla clásica en desktop (sm: en adelante); en mobile se reemplaza por una
 * lista de tarjetas apiladas (cada columna pasa a ser una fila "etiqueta: valor")
 * para no depender de scroll horizontal.
 */
export function ResponsiveTable<T>({ columns, data, rowKey, rowClassName }: ResponsiveTableProps<T>) {
  const fieldColumns = columns.filter((c) => !c.actions);
  const actionColumns = columns.filter((c) => c.actions);

  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400 dark:border-gray-800">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={clsx('px-4 py-3 font-medium', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((row, index) => (
              <tr key={rowKey(row, index)} className={clsx('hover:bg-gray-50 dark:hover:bg-gray-800/50', rowClassName)}>
                {columns.map((col, i) => (
                  <td key={i} className={clsx('px-4 py-3', col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        {data.map((row, index) => (
          <div key={rowKey(row, index)} className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
            <div className="flex flex-col gap-1.5">
              {fieldColumns.map((col, i) => (
                <div key={i} className="flex items-start justify-between gap-3 text-sm">
                  <span className="shrink-0 text-xs font-medium uppercase text-gray-400">{col.header}</span>
                  <span className="text-right text-gray-700 dark:text-gray-300">{col.cell(row)}</span>
                </div>
              ))}
            </div>
            {actionColumns.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-end gap-1 border-t border-gray-100 pt-2 dark:border-gray-800">
                {actionColumns.map((col, i) => (
                  <div key={i}>{col.cell(row)}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
