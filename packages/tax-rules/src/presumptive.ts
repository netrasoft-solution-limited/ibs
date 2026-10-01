/**
 * Presumptive tax — small businesses assessed on staff strength rather than
 * on declared books.
 *
 * The bands are policy and live here. The amounts are NOT: they are configured
 * per tenant and per business type by the revenue authority, and are passed in.
 */

export type PresumptiveCategory = 'micro' | 'small' | 'medium';

export const PRESUMPTIVE_BANDS: ReadonlyArray<{
  category: PresumptiveCategory;
  min: number;
  max: number;
  label: string;
}> = [
  { category: 'micro', min: 1, max: 9, label: '1 to 9 employees' },
  { category: 'small', min: 10, max: 29, label: '10 to 29 employees' },
  { category: 'medium', min: 30, max: 50, label: '30 to 50 employees' },
];

/** Above this staff count a business falls outside presumptive assessment. */
export const PRESUMPTIVE_MAX_STAFF = 50;

export class OutsidePresumptiveRangeError extends Error {
  constructor(readonly staffCount: number) {
    super(
      `A business with ${staffCount} staff falls outside presumptive assessment ` +
        `(the range is 1 to ${PRESUMPTIVE_MAX_STAFF}). Assess by direct assessment instead.`,
    );
    this.name = 'OutsidePresumptiveRangeError';
  }
}

/** Returns the band a staff count falls into, or null if outside the range. */
export function categoriseByStaff(staffCount: number): PresumptiveCategory | null {
  if (!Number.isFinite(staffCount)) return null;
  const band = PRESUMPTIVE_BANDS.find((b) => staffCount >= b.min && staffCount <= b.max);
  return band ? band.category : null;
}

export interface PresumptiveSchedule {
  micro: number;
  small: number;
  medium: number;
  frequency: string;
}

export interface PresumptiveResult {
  staffCount: number;
  category: PresumptiveCategory;
  payableAmount: number;
  frequency: string;
}

/**
 * @param staffCount actual number of employees
 * @param schedule the authority's configured amounts for this business type
 */
export function computePresumptive(
  staffCount: number,
  schedule: PresumptiveSchedule,
): PresumptiveResult {
  const category = categoriseByStaff(staffCount);
  if (!category) throw new OutsidePresumptiveRangeError(staffCount);

  return {
    staffCount,
    category,
    payableAmount: schedule[category],
    frequency: schedule.frequency,
  };
}
