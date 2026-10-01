/**
 * Billing rules — due dates and taxpayer identifiers.
 */

export type BillingFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one_off';

const OFFSETS: Record<BillingFrequency, (d: Date) => Date> = {
  weekly: (d) => addDays(d, 7),
  monthly: (d) => addMonths(d, 1),
  quarterly: (d) => addMonths(d, 3),
  yearly: (d) => addMonths(d, 12),
  one_off: (d) => addMonths(d, 1),
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const targetDay = d.getDate();
  d.setMonth(d.getMonth() + months);
  // Clamp when the target month is shorter (31 Jan + 1 month => 28/29 Feb).
  if (d.getDate() < targetDay) d.setDate(0);
  return d;
}

/** Due date for a single revenue head, from its billing frequency. */
export function dueDateFor(frequency: BillingFrequency, from: Date = new Date()): Date {
  const fn = OFFSETS[frequency];
  if (!fn) throw new Error(`Unknown billing frequency: ${frequency}`);
  return fn(from);
}

/**
 * Due date for an invoice carrying several revenue heads.
 * Where frequencies differ, the earliest due date governs the whole bill.
 */
export function invoiceDueDate(
  frequencies: BillingFrequency[],
  from: Date = new Date(),
): Date {
  if (!frequencies.length) throw new Error('An invoice must carry at least one revenue head');
  return frequencies
    .map((f) => dueDateFor(f, from))
    .reduce((earliest, d) => (d < earliest ? d : earliest));
}

/**
 * Taxpayer Identification Number.
 *
 * Format: two-digit year + two-digit local government area code + serial.
 * The LGA code is tenant data, not a hard-coded table — the legacy platform
 * baked one state's 27 LGAs into the application, which is precisely what made
 * it unusable for any other state without editing source.
 */
export interface TinParts {
  year: number;
  lgaCode: string;
  serial: string;
}

export function formatTin({ year, lgaCode, serial }: TinParts): string {
  const yy = String(year % 100).padStart(2, '0');
  const lga = String(lgaCode).padStart(2, '0');
  return `${yy}${lga}${serial}`;
}

export function parseTin(tin: string): TinParts | null {
  const m = /^(\d{2})(\d{2})(\d{5,})$/.exec(tin.trim());
  if (!m) return null;
  const yy = Number(m[1]);
  const century = yy > 70 ? 1900 : 2000;
  return { year: century + yy, lgaCode: m[2], serial: m[3] };
}

/** Generates the random serial portion. Uniqueness is enforced by the database. */
export function generateTinSerial(length = 5): string {
  let s = '';
  for (let i = 0; i < length; i++) s += Math.floor(Math.random() * 10);
  return s;
}
