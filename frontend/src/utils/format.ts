// new file: frontend/src/utils/format.ts
// Small formatting helpers for dates and numbers used across the frontend

export function formatDateISO(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (!isFinite(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return '—';
  }
}

/**
 * Format a number with N significant digits (default 2) while avoiding scientific notation
 * for typical product quantity values. This implementation ensures the number of
 * displayed significant digits is approximately sigDigits by computing how many
 * decimal places are required.
 */
export function formatSignificant(value: number | null | undefined, sigDigits = 2): string {
  if (value === null || value === undefined || !isFinite(Number(value))) return '—';
  const v = Number(value);
  if (v === 0) return (0).toFixed(sigDigits > 2 ? sigDigits : 2);

  const abs = Math.abs(v);
  const digitsBefore = abs >= 1 ? Math.floor(Math.log10(abs)) + 1 : 0;
  let decimals = sigDigits - digitsBefore;
  if (decimals < 0) decimals = 0;
  // cap decimals to 6 to avoid overly long strings
  if (decimals > 6) decimals = 6;
  return v.toFixed(decimals);
}

export function formatPercent(value: number | null | undefined, sigDigits = 2): string {
  if (value === null || value === undefined || !isFinite(Number(value))) return '—';
  return `${formatSignificant(Number(value), sigDigits)}%`;
}

