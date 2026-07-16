import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  MapIcon,
  BeakerIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalculatorIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/Card';
import { REPORTE_LABEL, TIPOS_REPORTE, TipoReporte } from '@/types/reportes';

const ICONS: Record<TipoReporte, typeof ChartBarIcon> = {
  produccion: ChartBarIcon,
  costos: BanknotesIcon,
  rentabilidad: ArrowTrendingUpIcon,
  cultivos: SparklesIcon,
  campos: MapIcon,
  quimicos: BeakerIcon,
  proveedores: BuildingStorefrontIcon,
  clientes: UserGroupIcon,
  facturacion: DocumentTextIcon,
  iva: CalculatorIcon,
  caja: Squares2X2Icon,
  tareas: ClipboardDocumentListIcon,
};

const DESCRIPCIONES: Record<TipoReporte, string> = {
  produccion: 'Producción por campo, cultivo y campaña',
  costos: 'Egresos financieros registrados',
  rentabilidad: 'Ingreso, costo y rentabilidad de cada rendimiento',
  cultivos: 'Listado completo de cultivos',
  campos: 'Listado completo de campos',
  quimicos: 'Aplicaciones de fertilizantes y herbicidas',
  proveedores: 'Proveedores con saldo de cuenta corriente',
  clientes: 'Clientes con saldo y ventas totales',
  facturacion: 'Facturas de venta y compra',
  iva: 'Débito, crédito fiscal y saldo técnico mensual',
  caja: 'Todos los movimientos financieros',
  tareas: 'Tareas agrícolas programadas',
};

export const ReportesListPage = () => (
  <div className="flex flex-col gap-6">
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Reportes</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Exportá cualquier reporte a PDF, Excel o CSV
      </p>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {TIPOS_REPORTE.map((tipo) => {
        const Icon = ICONS[tipo];
        return (
          <Link key={tipo} to={`/reportes/${tipo}`}>
            <Card className="flex h-full items-start gap-3 transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{REPORTE_LABEL[tipo]}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{DESCRIPCIONES[tipo]}</p>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  </div>
);
