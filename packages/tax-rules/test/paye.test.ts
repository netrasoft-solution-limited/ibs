import { describe, it, expect } from 'vitest';
import { computePaye, applyBands, EXEMPTION_THRESHOLD } from '../src/paye';

describe('PAYE exemption', () => {
  it('exempts income at the threshold', () => {
    const r = computePaye({ annualGrossIncome: EXEMPTION_THRESHOLD });
    expect(r.exempt).toBe(true);
    expect(r.annualTaxPayable).toBe(0);
    expect(r.monthlyTaxPayable).toBe(0);
  });

  it('taxes income one naira above the threshold', () => {
    const r = computePaye({ annualGrossIncome: EXEMPTION_THRESHOLD + 1 });
    expect(r.exempt).toBe(false);
    expect(r.annualTaxPayable).toBeGreaterThan(0);
  });

  it('treats zero and negative income as exempt rather than throwing', () => {
    expect(computePaye({ annualGrossIncome: 0 }).annualTaxPayable).toBe(0);
    expect(computePaye({ annualGrossIncome: -50_000 }).annualTaxPayable).toBe(0);
  });
});

describe('PAYE worked examples', () => {
  // Gross 1,000,000, no statutory deductions.
  //   CRA        = 1,000,000 x 20% + max(200,000, 1%) = 200,000 + 200,000 = 400,000
  //   chargeable = 600,000
  //   band 1     = 300,000 @ 7%  =  21,000
  //   band 2     = 300,000 @ 11% =  33,000
  //   annual     =                  54,000
  it('computes 1,000,000 gross with no deductions', () => {
    const r = computePaye({ annualGrossIncome: 1_000_000 });
    expect(r.consolidatedReliefAllowance).toBe(400_000);
    expect(r.chargeableIncome).toBe(600_000);
    expect(r.annualTaxPayable).toBe(54_000);
    expect(r.monthlyTaxPayable).toBe(4_500);
    expect(r.bands).toHaveLength(2);
  });

  // Gross 3,000,000 with all three statutory deductions.
  //   statutory  = 15.5% of gross                      =   465,000
  //   base       = 2,535,000
  //   CRA        = 507,000 + max(200,000, 25,350)      =   707,000
  //   chargeable = 1,828,000
  //   bands      = 21,000 + 33,000 + 75,000 + 95,000 + 47,880
  //   annual     =                                         271,880
  it('computes 3,000,000 gross with NHF, pension and NHIS', () => {
    const r = computePaye({
      annualGrossIncome: 3_000_000,
      deductions: { nhf: true, pension: true, nhis: true },
    });
    expect(r.statutoryDeductions).toBe(465_000);
    expect(r.consolidatedReliefAllowance).toBe(707_000);
    expect(r.chargeableIncome).toBe(1_828_000);
    expect(r.annualTaxPayable).toBe(271_880);
    expect(r.monthlyTaxPayable).toBe(22_656.67);
    expect(r.bands).toHaveLength(5);
  });

  it('applies the CRA percentage rather than the floor on high incomes', () => {
    // 1% of base exceeds 200,000 once base passes 20,000,000.
    const r = computePaye({ annualGrossIncome: 30_000_000 });
    expect(r.consolidatedReliefAllowance).toBe(30_000_000 * 0.2 + 30_000_000 * 0.01);
  });

  it('reduces liability when reliefs are claimed', () => {
    const without = computePaye({ annualGrossIncome: 5_000_000 });
    const withRelief = computePaye({
      annualGrossIncome: 5_000_000,
      reliefs: { lifeAssurance: 250_000 },
    });
    expect(withRelief.annualTaxPayable).toBeLessThan(without.annualTaxPayable);
  });
});

describe('PAYE bands', () => {
  it('fills bands in order and stops when income is exhausted', () => {
    const { rows, total } = applyBands(450_000);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ rate: 0.07, taxable: 300_000, tax: 21_000 });
    expect(rows[1]).toEqual({ rate: 0.11, taxable: 150_000, tax: 16_500 });
    expect(total).toBe(37_500);
  });

  it('applies the top rate above 3,200,000 of chargeable income', () => {
    const { rows } = applyBands(4_000_000);
    expect(rows).toHaveLength(6);
    expect(rows[5].rate).toBe(0.24);
    expect(rows[5].taxable).toBe(800_000);
  });

  it('is monotonic — more income never means less tax', () => {
    let previous = 0;
    for (let gross = 400_000; gross <= 12_000_000; gross += 400_000) {
      const tax = computePaye({ annualGrossIncome: gross }).annualTaxPayable;
      expect(tax).toBeGreaterThanOrEqual(previous);
      previous = tax;
    }
  });

  it('never charges an effective rate above the top marginal rate', () => {
    for (const gross of [500_000, 2_000_000, 10_000_000, 100_000_000]) {
      expect(computePaye({ annualGrossIncome: gross }).effectiveRate).toBeLessThan(24);
    }
  });
});
