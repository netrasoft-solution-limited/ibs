import { describe, it, expect } from 'vitest';
import { computeWht } from '../src/wht';
import {
  computePresumptive,
  categoriseByStaff,
  OutsidePresumptiveRangeError,
} from '../src/presumptive';
import { dueDateFor, invoiceDueDate, formatTin, parseTin } from '../src/billing';

describe('withholding tax', () => {
  it('withholds 10% on rent for either recipient type', () => {
    expect(computeWht(1_000_000, 'rent', 'individual').whtDue).toBe(100_000);
    expect(computeWht(1_000_000, 'rent', 'company').whtDue).toBe(100_000);
  });

  it('uplifts consultancy from 5% to 10% for a company recipient', () => {
    expect(computeWht(1_000_000, 'consultancy', 'individual').whtDue).toBe(50_000);
    expect(computeWht(1_000_000, 'consultancy', 'company').whtDue).toBe(100_000);
  });

  it('does not uplift construction — it stays at 5% for a company', () => {
    expect(computeWht(1_000_000, 'construction', 'company').whtDue).toBe(50_000);
  });

  it('returns the net payment due to the recipient', () => {
    const r = computeWht(750_000, 'professional_fees', 'individual');
    expect(r.whtDue).toBe(37_500);
    expect(r.netPayment).toBe(712_500);
    expect(r.whtDue + r.netPayment).toBe(r.transactionAmount);
  });

  it('rejects an unknown category', () => {
    expect(() => computeWht(1000, 'not_a_category' as never, 'individual')).toThrow();
  });
});

describe('presumptive tax', () => {
  const schedule = { micro: 15_000, small: 40_000, medium: 90_000, frequency: 'yearly' };

  it('places staff counts in the correct band, including at the boundaries', () => {
    expect(categoriseByStaff(1)).toBe('micro');
    expect(categoriseByStaff(9)).toBe('micro');
    expect(categoriseByStaff(10)).toBe('small');
    expect(categoriseByStaff(29)).toBe('small');
    expect(categoriseByStaff(30)).toBe('medium');
    expect(categoriseByStaff(50)).toBe('medium');
  });

  it('returns the authority-configured amount for the band', () => {
    expect(computePresumptive(12, schedule)).toMatchObject({
      category: 'small',
      payableAmount: 40_000,
      frequency: 'yearly',
    });
  });

  it('refuses a business above 50 staff', () => {
    expect(() => computePresumptive(51, schedule)).toThrow(OutsidePresumptiveRangeError);
  });

  it('refuses a business with no staff', () => {
    expect(() => computePresumptive(0, schedule)).toThrow(OutsidePresumptiveRangeError);
  });
});

describe('billing due dates', () => {
  const from = new Date('2026-01-15T00:00:00Z');

  it('offsets by the billing frequency', () => {
    expect(dueDateFor('weekly', from).toISOString().slice(0, 10)).toBe('2026-01-22');
    expect(dueDateFor('monthly', from).toISOString().slice(0, 10)).toBe('2026-02-15');
    expect(dueDateFor('quarterly', from).toISOString().slice(0, 10)).toBe('2026-04-15');
    expect(dueDateFor('yearly', from).toISOString().slice(0, 10)).toBe('2027-01-15');
  });

  it('clamps to the last day when the target month is shorter', () => {
    const jan31 = new Date('2026-01-31T00:00:00Z');
    expect(dueDateFor('monthly', jan31).toISOString().slice(0, 10)).toBe('2026-02-28');
  });

  it('takes the earliest due date across several revenue heads', () => {
    const due = invoiceDueDate(['yearly', 'monthly', 'quarterly'], from);
    expect(due.toISOString().slice(0, 10)).toBe('2026-02-15');
  });

  it('refuses an invoice with no revenue heads', () => {
    expect(() => invoiceDueDate([], from)).toThrow();
  });
});

describe('taxpayer identification number', () => {
  it('formats year, LGA code and serial', () => {
    expect(formatTin({ year: 2026, lgaCode: '07', serial: '48213' })).toBe('260748213');
  });

  it('pads a single-digit LGA code', () => {
    expect(formatTin({ year: 2026, lgaCode: '3', serial: '11111' })).toBe('260311111');
  });

  it('round-trips through parse', () => {
    const parts = { year: 2026, lgaCode: '07', serial: '48213' };
    expect(parseTin(formatTin(parts))).toEqual(parts);
  });

  it('returns null for a malformed identifier', () => {
    expect(parseTin('not-a-tin')).toBeNull();
    expect(parseTin('2607')).toBeNull();
  });
});
