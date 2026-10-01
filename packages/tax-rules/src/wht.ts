/**
 * Withholding tax — deduction at source.
 *
 * Rates differ by transaction category, and several categories carry a higher
 * rate where the recipient is a company rather than an individual.
 */

export type RecipientType = 'individual' | 'company';

export type WhtCategory =
  | 'rent'
  | 'dividends'
  | 'interest'
  | 'royalties'
  | 'directors_fees'
  | 'consultancy'
  | 'professional_fees'
  | 'commissions'
  | 'construction'
  | 'contracts_and_supplies';

interface RateRule {
  label: string;
  individual: number;
  company: number;
}

export const WHT_RATES: Record<WhtCategory, RateRule> = {
  rent: { label: 'Rent', individual: 0.1, company: 0.1 },
  dividends: { label: 'Dividends', individual: 0.1, company: 0.1 },
  interest: { label: 'Interest', individual: 0.1, company: 0.1 },
  royalties: { label: 'Royalties', individual: 0.1, company: 0.1 },
  directors_fees: { label: "Directors' fees", individual: 0.1, company: 0.1 },
  consultancy: { label: 'Consultancy', individual: 0.05, company: 0.1 },
  professional_fees: { label: 'Professional fees', individual: 0.05, company: 0.1 },
  commissions: { label: 'Commissions', individual: 0.05, company: 0.1 },
  construction: { label: 'Construction', individual: 0.05, company: 0.05 },
  contracts_and_supplies: {
    label: 'Contracts and supplies',
    individual: 0.05,
    company: 0.05,
  },
};

export interface WhtResult {
  category: WhtCategory;
  label: string;
  recipientType: RecipientType;
  transactionAmount: number;
  rate: number;
  whtDue: number;
  netPayment: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeWht(
  transactionAmount: number,
  category: WhtCategory,
  recipientType: RecipientType,
): WhtResult {
  const rule = WHT_RATES[category];
  if (!rule) {
    throw new Error(`Unknown withholding tax category: ${category}`);
  }

  const amount = Math.max(0, transactionAmount ?? 0);
  const rate = recipientType === 'company' ? rule.company : rule.individual;
  const whtDue = round2(amount * rate);

  return {
    category,
    label: rule.label,
    recipientType,
    transactionAmount: amount,
    rate,
    whtDue,
    netPayment: round2(amount - whtDue),
  };
}

export function listWhtCategories() {
  return (Object.keys(WHT_RATES) as WhtCategory[]).map((key) => ({
    key,
    ...WHT_RATES[key],
  }));
}
