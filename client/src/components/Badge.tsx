import { HTMLAttributes } from 'react';
import clsx from 'clsx';

type Tone = 'green' | 'yellow' | 'red' | 'gray';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  green: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200',
  yellow: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export const Badge = ({ tone = 'gray', className, ...props }: BadgeProps) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      toneClasses[tone],
      className,
    )}
    {...props}
  />
);
