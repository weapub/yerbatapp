import { Badge } from '@/components/Badge';
import { Semaforo } from '@/types/tareas';

const LABELS: Record<NonNullable<Semaforo>, string> = {
  ROJO: 'Urgente / vencida',
  AMARILLO: 'Próxima a vencer',
  VERDE: 'En tiempo',
};

const TONES: Record<NonNullable<Semaforo>, 'red' | 'yellow' | 'green'> = {
  ROJO: 'red',
  AMARILLO: 'yellow',
  VERDE: 'green',
};

export const SemaforoBadge = ({ semaforo }: { semaforo: Semaforo }) => {
  if (!semaforo) return <Badge tone="gray">Cerrada</Badge>;
  return <Badge tone={TONES[semaforo]}>{LABELS[semaforo]}</Badge>;
};

export const SemaforoDot = ({ semaforo }: { semaforo: Semaforo }) => {
  const color = semaforo === 'ROJO' ? 'bg-red-500' : semaforo === 'AMARILLO' ? 'bg-amber-500' : semaforo === 'VERDE' ? 'bg-brand-500' : 'bg-gray-300';
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
};
