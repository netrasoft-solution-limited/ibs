/**
 * Pay As You Earn — the single source of truth.
 *
 * The legacy platform computed PAYE in three separate places (PayeeController,
 * OtherKindsTaxController, RegistrationController) with materially different
 * relief formulas and exemption thresholds, so a taxpayer's liability depended
 * on which screen raised it. This module is the one implementation. Nothing
 * else in the platform may compute PAYE.
 */

/** Statutory deduction rates applied to annual gross income. */
export const STATUTORY_RATES = {
  /** National Housing Fund */
  nhf: 0.025,
  /** Pension contribution */
  pension: 0.08,
  /** National Health Insurance Scheme */
  nhis: 0.05,
} as const;

/**
 * Consolidated Relief Allowance: 20% of income after statutory deductions,
 * plus the greater of NGN 200,000 or 1% of that same base.
 */
export const CRA = { rate: 0.2, floor: 200_000, alternateRate: 0.01 } as const;

/** Annual gross income at or below this is exempt from PAYE entirely. */
export const EXEMPTION_THRESHOLD = 360_000;

/** Progressive bands applied to chargeable income, in order. */
export const BANDS: ReadonlyArray<{ width: number; rate: number }> = [
  { width: 300_000, rate: 0.07 },
  { width: 300_000, rate: 0.11 },
  { width: 500_000, rate: 0.15 },
  { width: 500_000, rate: 0.19 },
  { width: 1_600_000, rate: 0.21 },
  { width: Infinity, rate: 0.24 },
];

export interface PayeInput {
  /** Annual gross income in naira. */
  annualGrossIncome: number;
  /** Which statutory deductions this employee is enrolled in. */
  deductions?: { nhf?: boolean; pension?: boolean; nhis?: boolean };
  /** Flat annual amounts, e.g. life assurance premiums or gratuities. */
  reliefs?: { lifeAssurance?: number; gratuities?: number };
}

export interface PayeBreakdown {
  annualGrossIncome: number;
  statutoryDeductions: number;
  otherReliefs: number;
  consolidatedReliefAllowance: number;
  chargeableIncome: number;
  bands: Array<{ rate: number; taxable: number; tax: number }>;
  annualTaxPayable: number;
  monthlyTaxPayable: number;
  exempt: boolean;
  effectiveRate: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Splits chargeable income across the progressive bands. */
export function applyBands(chargeableIncome: number) {
  let remaining = Math.max(0, chargeableIncome);
  const rows: Array<{ rate: number; taxable: number; tax: number }> = [];

  for (const band of BANDS) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, band.width);
    rows.push({ rate: band.rate, taxable: round2(taxable), tax: round2(taxable * band.rate) });
    remaining -= taxable;
  }

  return { rows, total: round2(rows.reduce((sum, r) => sum + r.tax, 0)) };
}

/** Computes annual and monthly PAYE liability with a full audit breakdown. */
export function computePaye(input: PayeInput): PayeBreakdown {
  const gross = Math.max(0, input.annualGrossIncome ?? 0);

  const empty: PayeBreakdown = {
    annualGrossIncome: gross,
    statutoryDeductions: 0,
    otherReliefs: 0,
    consolidatedReliefAllowance: 0,
    chargeableIncome: 0,
    bands: [],
    annualTaxPayable: 0,
    monthlyTaxPayable: 0,
    exempt: true,
    effectiveRate: 0,
  };

  if (gross <= EXEMPTION_THRESHOLD) return empty;

  const d = input.deductions ?? {};
  const statutoryDeductions = round2(
    (d.nhf ? gross * STATUTORY_RATES.nhf : 0) +
      (d.pension ? gross * STATUTORY_RATES.pension : 0) +
      (d.nhis ? gross * STATUTORY_RATES.nhis : 0),
  );

  const r = input.reliefs ?? {};
  const otherReliefs = round2((r.lifeAssurance ?? 0) + (r.gratuities ?? 0));

  const base = Math.max(0, gross - statutoryDeductions - otherReliefs);
  const consolidatedReliefAllowance = round2(
    base * CRA.rate + Math.max(CRA.floor, base * CRA.alternateRate),
  );

  const chargeableIncome = round2(Math.max(0, base - consolidatedReliefAllowance));
  const { rows, total } = applyBands(chargeableIncome);

  return {
    annualGrossIncome: gross,
    statutoryDeductions,
    otherReliefs,
    consolidatedReliefAllowance,
    chargeableIncome,
    bands: rows,
    annualTaxPayable: total,
    monthlyTaxPayable: round2(total / 12),
    exempt: total === 0,
    effectiveRate: gross > 0 ? round2((total / gross) * 100) : 0,
  };
}
