import clsx from 'clsx';

export const Spinner = ({ className }: { className?: string }) => (
  <div
    className={clsx(
      'h-6 w-6 animate-spin rounded-full border-2 border-brand-800 border-t-transparent dark:border-brand-300',
      className,
    )}
  />
);

export const FullPageSpinner = () => (
  <div className="flex h-full min-h-[40vh] w-full items-center justify-center">
    <Spinner className="h-8 w-8" />
  </div>
);
