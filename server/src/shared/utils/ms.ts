const UNITS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
} as const;

/** Convierte strings tipo "15m", "7d", "1h" a milisegundos. */
export default function ms(value: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) throw new Error(`Formato de duración inválido: "${value}"`);
  const [, amount, unit] = match;
  return Number(amount) * UNITS[unit as keyof typeof UNITS];
}
