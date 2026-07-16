import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-14 text-center dark:border-gray-700">
    {icon && <div className="mb-1 text-gray-400 dark:text-gray-600">{icon}</div>}
    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
    {description && <p className="max-w-sm text-sm text-gray-500 dark:text-gray-500">{description}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);
