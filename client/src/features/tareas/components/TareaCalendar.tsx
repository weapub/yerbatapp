import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { tareasApi } from '../api/tareasApi';
import { SemaforoDot } from './SemaforoBadge';
import { Card } from '@/components/Card';
import { Spinner } from '@/components/Spinner';
import { Tarea } from '@/types/tareas';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

export const TareaCalendar = ({ onSelectTarea }: { onSelectTarea: (tarea: Tarea) => void }) => {
  const [cursor, setCursor] = useState(() => new Date());

  const { primerDia, ultimoDia, celdas } = useMemo(() => {
    const primerDia = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const ultimoDia = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

    const offsetInicio = (primerDia.getDay() + 6) % 7; // lunes = 0
    const celdas: (Date | null)[] = Array(offsetInicio).fill(null);
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      celdas.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    }
    while (celdas.length % 7 !== 0) celdas.push(null);

    return { primerDia, ultimoDia, celdas };
  }, [cursor]);

  const { data: tareas, isLoading } = useQuery({
    queryKey: ['tareas', 'calendario', toISODate(primerDia), toISODate(ultimoDia)],
    queryFn: () => tareasApi.calendario(toISODate(primerDia), toISODate(ultimoDia)),
  });

  const tareasPorDia = useMemo(() => {
    const map = new Map<string, Tarea[]>();
    for (const tarea of tareas ?? []) {
      const key = tarea.fechaProgramada.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), tarea]);
    }
    return map;
  }, [tareas]);

  const hoy = toISODate(new Date());

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {cursor.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-7 gap-1 text-xs">
          {DIAS.map((d) => (
            <div key={d} className="px-1 pb-1 text-center font-semibold text-gray-400">
              {d}
            </div>
          ))}
          {celdas.map((fecha, index) => {
            if (!fecha) return <div key={index} />;
            const key = toISODate(fecha);
            const tareasDelDia = tareasPorDia.get(key) ?? [];
            return (
              <div
                key={key}
                className={`min-h-[76px] rounded-lg border p-1.5 ${
                  key === hoy
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-gray-100 dark:border-gray-800'
                }`}
              >
                <p className="mb-1 text-right text-gray-400">{fecha.getDate()}</p>
                <div className="flex flex-col gap-0.5">
                  {tareasDelDia.slice(0, 3).map((tarea) => (
                    <button
                      key={tarea.id}
                      onClick={() => onSelectTarea(tarea)}
                      className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                      title={tarea.observaciones ?? ''}
                    >
                      <SemaforoDot semaforo={tarea.semaforo} />
                      <span className="truncate text-gray-700 dark:text-gray-300">{tarea.campo.nombre}</span>
                    </button>
                  ))}
                  {tareasDelDia.length > 3 && (
                    <span className="px-1 text-gray-400">+{tareasDelDia.length - 3} más</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
