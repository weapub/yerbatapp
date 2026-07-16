import { SelectHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={clsx(
          'rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors',
          'bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          error ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-700',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  ),
);
Select.displayName = 'Select';
