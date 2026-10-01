'use client';

import { useMemo, useState } from 'react';

import { CRA, EXEMPTION_THRESHOLD, STATUTORY_RATES, computePaye } from '@igr/tax-rules';
import { Card, Field, Input, StatTile, Table, Td, Th, TileRow, Tr } from '@/components/ui';
import { money, percent } from '@/lib/format';

/**
 * The screen does not know how to compute PAYE and must not learn. It collects
 * inputs, hands them to @igr/tax-rules, and renders whatever comes back — which
 * is the same function the API calls when it raises the bill for real.
 */
export function PayeCalculator() {
  const [gross, setGross] = useState(4_800_000);
  const [nhf, setNhf] = useState(true);
  const [pension, setPension] = useState(true);
  const [nhis, setNhis] = useState(true);
  const [lifeAssurance, setLifeAssurance] = useState(0);

  const result = useMemo(
    () =>
      computePaye({
        annualGrossIncome: gross,
        deductions: { nhf, pension, nhis },
        reliefs: { lifeAssurance },
      }),
    [gross, nhf, pension, nhis, lifeAssurance],
  );

  return (
    <>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <div>
            <h2 className="text-[16px] font-semibold">Employee</h2>
          </div>
          <Card className="mt-4 space-y-4">
            <Field label="Annual gross income" hint={`Income at or below ${money(EXEMPTION_THRESHOLD)} is exempt.`}>
              <Input
                type="number"
                min={0}
                step={10_000}
                value={gross}
                onChange={(e) => setGross(Math.max(0, Number(e.target.value)))}
              />
            </Field>

            <fieldset>
              <legend className="mb-2 text-[12.5px] font-medium text-ink-2">Statutory deductions</legend>
              <div className="space-y-2">
                {(
                  [
                    ['National Housing Fund', STATUTORY_RATES.nhf, nhf, setNhf],
                    ['Pension contribution', STATUTORY_RATES.pension, pension, setPension],
                    ['National Health Insurance', STATUTORY_RATES.nhis, nhis, setNhis],
                  ] as const
                ).map(([label, rate, value, set]) => (
                  <label key={label} className="flex items-center justify-between gap-3 border-b border-rule pb-2 last:border-b-0">
                    <span className="text-[13px] text-ink-2">
                      {label}
                      <span className="tabular ml-1.5 text-[11.5px] text-ink-3">{(rate * 100).toFixed(1)}%</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => set(e.target.checked)}
                      className="h-4 w-4 accent-[var(--tenant-accent)]"
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <Field label="Life assurance premium" hint="Annual, if claimed.">
              <Input
                type="number"
                min={0}
                step={10_000}
                value={lifeAssurance}
                onChange={(e) => setLifeAssurance(Math.max(0, Number(e.target.value)))}
              />
            </Field>
          </Card>

          <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
            Consolidated relief is {CRA.rate * 100}% of income after statutory deductions, plus the greater
            of {money(CRA.floor)} or {CRA.alternateRate * 100}% of that same base.
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-[16px] font-semibold">Assessment</h2>
            <span className="eyebrow">{result.exempt ? 'Exempt' : 'Liable'}</span>
          </div>

          <TileRow cols={3}>
            <StatTile label="Annual tax payable" value={money(result.annualTaxPayable)} tone="accent" />
            <StatTile label="Monthly deduction" value={money(result.monthlyTaxPayable)} sub="Remitted by the employer" />
            <StatTile label="Effective rate" value={percent(result.effectiveRate, 2)} sub="Against gross income" />
          </TileRow>

          <Card className="mt-6">
            <h3 className="text-[14px]">How the chargeable income was reached</h3>
            <dl className="mt-2">
              {(
                [
                  ['Annual gross income', result.annualGrossIncome, false],
                  ['Less statutory deductions', -result.statutoryDeductions, true],
                  ['Less other reliefs', -result.otherReliefs, true],
                  ['Less consolidated relief allowance', -result.consolidatedReliefAllowance, true],
                ] as const
              ).map(([label, value, negative]) => (
                <div key={label} className="flex justify-between gap-6 border-b border-rule py-2">
                  <dt className="text-[13px] text-ink-3">{label}</dt>
                  <dd className={`tabular text-[13.5px] ${negative ? 'text-ink-2' : 'text-ink'}`}>
                    {money(value)}
                  </dd>
                </div>
              ))}
              <div className="flex justify-between gap-6 border-t border-rule-2 pt-2.5">
                <dt className="text-[14px] font-medium">Chargeable income</dt>
                <dd className="tabular text-[15px] font-medium">{money(result.chargeableIncome)}</dd>
              </div>
            </dl>
          </Card>

          {result.bands.length > 0 ? (
            <>
              <div className="mt-6">
                <h2 className="text-[16px] font-semibold">Band by band</h2>
              </div>
              <Table>
                <thead>
                  <tr>
                    <Th>Band</Th>
                    <Th align="right">Rate</Th>
                    <Th align="right">Taxed at this rate</Th>
                    <Th align="right">Tax</Th>
                  </tr>
                </thead>
                <tbody>
                  {result.bands.map((b, i) => (
                    <Tr key={`${b.rate}-${i}`}>
                      <Td mono className="text-ink-3">
                        {i + 1}
                      </Td>
                      <Td align="right" mono>
                        {(b.rate * 100).toFixed(0)}%
                      </Td>
                      <Td align="right" mono>
                        {money(b.taxable)}
                      </Td>
                      <Td align="right" mono>
                        {money(b.tax)}
                      </Td>
                    </Tr>
                  ))}
                  <tr>
                    <td colSpan={3} className="border-t border-rule-2 pt-3 text-right text-[14px] font-medium">
                      Annual tax payable
                    </td>
                    <td className="tabular border-t border-rule-2 pt-3 text-right text-[16px] font-medium">
                      {money(result.annualTaxPayable)}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </>
          ) : (
            <Card className="mt-6 bg-warn-bg/60">
              <p className="text-[13.5px] text-ink-2">
                This income falls at or below the exemption threshold of {money(EXEMPTION_THRESHOLD)}. No
                pay-as-you-earn liability arises.
              </p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
