// typescript
// File: frontend/src/utils/format.ts
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
 * Format a number with N significant digits (default 2).
 * Properly handles both large and small numbers including values less than 1.
 *
 * Examples with sigDigits = 2:
 * - 0.001076 → "0.0011"
 * - 0.00008453 → "0.000085"
 * - 1.234 → "1.2"
 * - 123.456 → "120"
 * - 0 → "0"
 */
export function formatSignificant(value: number | null | undefined, sigDigits = 2): string {
  if (value === null || value === undefined || !isFinite(Number(value))) return '—';
  const v = Number(value);

  // Handle zero
  if (v === 0) return '0';

  const abs = Math.abs(v);

  // For numbers >= 1, calculate digits before decimal point
  if (abs >= 1) {
    const digitsBefore = Math.floor(Math.log10(abs)) + 1;
    let decimals = sigDigits - digitsBefore;
    if (decimals < 0) decimals = 0;
    if (decimals > 6) decimals = 6; // Cap to avoid overly long strings
    return v.toFixed(decimals);
  }

  // For numbers < 1, we need to account for leading zeros
  // Find the position of the first significant digit
  // log10(0.001076) = -2.968... → floor = -3
  // So the first significant digit is at position 3 after the decimal point
  const firstSigDigitPos = -Math.floor(Math.log10(abs));

  // Total decimal places needed = position of first sig digit + (sigDigits - 1)
  // For 0.001076 with sigDigits=2: firstSigDigitPos=3, decimals=3+(2-1)=4
  // This gives us "0.0011" (4 decimal places)
  const decimals = Math.min(firstSigDigitPos + sigDigits - 1, 10); // Cap at 10 decimals

  return v.toFixed(decimals);
}

export function formatPercent(value: number | null | undefined, sigDigits = 2): string {
  if (value === null || value === undefined || !isFinite(Number(value))) return '—';
  return `${formatSignificant(Number(value), sigDigits)}%`;
}

/**
 * Smart unit formatter that converts units to more readable forms.
 * Examples:
 * - 0.5 kg → 500 g
 * - 1500 g → 1.5 kg
 * - 0.001 l → 1 ml
 * - 2000 ml → 2 l
 * - 0.75 lb → 12 oz
 * - 20 oz → 1.2 lb
 */
export function formatWithSmartUnit(
    value: number | null | undefined,
    unit: string,
    sigDigits = 2
): { value: string; unit: string; formatted: string } {
  if (value === null || value === undefined || !isFinite(Number(value))) {
    return { value: '—', unit, formatted: '—' };
  }

  const v = Number(value);
  const absV = Math.abs(v);

  // Unit conversion mappings
  const conversions: Record<string, { largerUnit: string; smallerUnit: string; ratio: number }> = {
    // Weight conversions
    'kg': { largerUnit: 'kg', smallerUnit: 'g', ratio: 1000 },
    'g': { largerUnit: 'kg', smallerUnit: 'g', ratio: 1000 },

    // Volume conversions (metric)
    'l': { largerUnit: 'l', smallerUnit: 'ml', ratio: 1000 },
    'ml': { largerUnit: 'l', smallerUnit: 'ml', ratio: 1000 },

    // Volume conversions (imperial)
    'gal': { largerUnit: 'gal', smallerUnit: 'qt', ratio: 4 },
    'qt': { largerUnit: 'gal', smallerUnit: 'qt', ratio: 4 },

    // Weight conversions (imperial)
    'lb': { largerUnit: 'lb', smallerUnit: 'oz', ratio: 16 },
    'oz': { largerUnit: 'lb', smallerUnit: 'oz', ratio: 16 },
  };

  const conversion = conversions[unit.toLowerCase()];

  if (!conversion) {
    // No conversion available, return as-is
    const formatted = formatSignificant(v, sigDigits);
    return { value: formatted, unit, formatted: `${formatted} ${unit}` };
  }

  const { largerUnit, smallerUnit, ratio } = conversion;
  const currentUnit = unit.toLowerCase();

  // If current unit is the larger unit and value < 1, convert to smaller
  if (currentUnit === largerUnit && absV < 1 && absV > 0) {
    const convertedValue = v * ratio;
    const formatted = formatSignificant(convertedValue, sigDigits);
    return { value: formatted, unit: smallerUnit, formatted: `${formatted} ${smallerUnit}` };
  }

  // If current unit is the smaller unit and value >= ratio, convert to larger
  if (currentUnit === smallerUnit && absV >= ratio) {
    const convertedValue = v / ratio;
    const formatted = formatSignificant(convertedValue, sigDigits);
    return { value: formatted, unit: largerUnit, formatted: `${formatted} ${largerUnit}` };
  }

  // Otherwise, keep the same unit
  const formatted = formatSignificant(v, sigDigits);
  return { value: formatted, unit, formatted: `${formatted} ${unit}` };
}

/**
 * Format a quantity with its unit, automatically converting to most readable form.
 * This is a convenience wrapper around formatWithSmartUnit.
 */
export function formatQuantity(
    value: number | null | undefined,
    unit: string,
    sigDigits = 2
): string {
  return formatWithSmartUnit(value, unit, sigDigits).formatted;
}