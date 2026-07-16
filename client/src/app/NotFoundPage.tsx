import { Link } from 'react-router-dom';

export const NotFoundPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-950">
    <h1 className="text-4xl font-bold text-brand-800 dark:text-brand-300">404</h1>
    <p className="text-gray-600 dark:text-gray-400">Página no encontrada</p>
    <Link to="/" className="text-sm text-brand-700 hover:underline dark:text-brand-300">
      Volver al inicio
    </Link>
  </div>
);
