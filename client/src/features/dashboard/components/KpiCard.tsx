import { ComponentType, SVGProps } from 'react';
import { Card } from '@/components/Card';

interface KpiCardProps {
  label: string;
  value: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  hint?: string;
}

export const KpiCard = ({ label, value, icon: Icon, hint }: KpiCardProps) => (
  <Card className="flex items-center gap-4">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  </Card>
);
