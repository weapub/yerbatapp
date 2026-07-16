import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useUiStore } from '@/store/ui.store';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useUiStore();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
    >
      {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
    </button>
  );
};
