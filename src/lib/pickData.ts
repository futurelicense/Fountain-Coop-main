/** Read loosely-typed JSONB `data` fields from `operational_items`. */

export function pickStr(
  d: Record<string, unknown>,
  key: string,
  fallback = ''
): string {
  const v = d[key];
  return typeof v === 'string' ? v : fallback;
}

export function pickNum(d: Record<string, unknown>, key: string, fallback = 0): number {
  const v = d[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/,/g, ''));
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export function pickObj(
  d: Record<string, unknown>,
  key: string
): Record<string, unknown> | null {
  const v = d[key];
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}
