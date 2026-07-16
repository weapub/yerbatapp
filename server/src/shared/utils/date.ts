/**
 * Las fechas "solo fecha" (ej. fechaProgramada) llegan parseadas en UTC medianoche
 * (z.coerce.date() sobre strings "YYYY-MM-DD"). Comparar eso contra un `new Date()`
 * normalizado con `.setHours(0,0,0,0)` (hora local) corre el día calendario en
 * timezones negativos como America/Buenos_Aires (UTC-3). Estos helpers evitan
 * mezclar getters locales y UTC: todo se compara como medianoche UTC del día
 * calendario correspondiente (el del servidor para "hoy", que corre en la misma
 * timezone que la empresa).
 */

/** Medianoche UTC del día calendario actual en la timezone del servidor. */
export const hoyUTC = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

/** Normaliza una fecha a medianoche UTC de su propio día calendario UTC. */
export const aFechaUTC = (fecha: Date): Date =>
  new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
