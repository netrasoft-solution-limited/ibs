'use client';

import { useMemo, useState } from 'react';

import { computePaye } from '@igr/tax-rules';
import { Card, Field, Input, StatTile, Table, Td, Th, TileRow, Tr } from '@/components/ui';
import { money, percent } from '@/lib/format';

/**
 * Direct assessment differs from PAYE in what is captured, not in how it is
 * computed: the officer builds the annual income from its components, and the
 * same statutory function assesses it. There is no second implementation.
 */
const COMPONENTS = [
  ['basic', 'Basic salary', 2_400_000],
  ['housing', 'Housing allowance', 900_000],
  ['transport', 'Transport allowance', 480_000],
  ['utility', 'Utility allowance', 240_000],
  ['entertainment', 'Entertainment', 120_000],
  ['other', 'Other income', 360_000],
] as const;

type Key = (typeof COMPONENTS)[number][0];

export function DirectAssessmentForm() {
  const [values, setValues] = useState<Record<Key, number>>(
    Object.fromEntries(COMPONENTS.map(([k, , v]) => [k, v])) as Record<Key, number>,
  );
  const [nhf, setNhf] = useState(false);
  const [pension, setPension] = useState(true);
  const [nhis, setNhis] = useState(false);

  const gross = Object.values(values).reduce((s, v) => s + v, 0);

  const result = useMemo(
    () => computePaye({ annualGrossIncome: gross, deductions: { nhf, pension, nhis } }),
    [gross, nhf, pension, nhis],
  );

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
      <div>
        <h2 className="text-[16px] font-semibold">Income composition</h2>
        <Card className="mt-4 space-y-3">
          {COMPONENTS.map(([key, label]) => (
            <Field key={key} label={label}>
              <Input
                type="number"
                min={0}
                step={10_000}
                value={values[key]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [key]: Math.max(0, Number(e.target.value)) }))
                }
              />
            </Field>
          ))}

          <div className="flex items-baseline justify-between border-t border-rule-2 pt-3">
            <span className="text-[13.5px] font-medium">Annual gross</span>
            <span className="tabular text-[16px] font-semibold">{money(gross)}</span>
          </div>
        </Card>

        <h2 className="mt-6 text-[16px] font-semibold">Statutory deductions</h2>
        <Card className="mt-4">
          {(
            [
              ['National Housing Fund', nhf, setNhf],
              ['Pension contribution', pension, setPension],
              ['National Health Insurance', nhis, setNhis],
            ] as const
          ).map(([label, value, set]) => (
            <label
              key={label}
              className="flex items-center justify-between gap-3 border-b border-rule py-2.5 last:border-b-0"
            >
              <span className="text-[13px] text-ink-2">{label}</span>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => set(e.target.checked)}
                className="h-4 w-4 accent-[var(--tenant-accent)]"
              />
            </label>
          ))}
        </Card>
      </div>

      <div>
        <h2 className="text-[16px] font-semibold">Assessment</h2>

        <TileRow cols={3}>
          <StatTile label="Annual tax payable" value={money(result.annualTaxPayable)} tone="accent" />
          <StatTile label="Monthly equivalent" value={money(result.monthlyTaxPayable)} />
          <StatTile label="Effective rate" value={percent(result.effectiveRate, 2)} sub="Against gross" />
        </TileRow>

        <Card className="mt-6">
          <h3 className="text-[14px] font-semibold">How the chargeable income was reached</h3>
          <dl className="mt-2">
            {(
              [
                ['Annual gross income', result.annualGrossIncome],
                ['Less statutory deductions', -result.statutoryDeductions],
                ['Less consolidated relief allowance', -result.consolidatedReliefAllowance],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between gap-6 border-b border-rule py-2">
                <dt className="text-[13px] text-ink-3">{label}</dt>
                <dd className="tabular text-[13.5px]">{money(value)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-6 border-t border-rule-2 pt-2.5">
              <dt className="text-[14px] font-medium">Chargeable income</dt>
              <dd className="tabular text-[15px] font-semibold">{money(result.chargeableIncome)}</dd>
            </div>
          </dl>
        </Card>

        {result.bands.length > 0 ? (
          <>
            <h2 className="mt-6 text-[16px] font-semibold">Band by band</h2>
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
              </tbody>
            </Table>
          </>
        ) : (
          <Card className="mt-6 bg-warn-bg/60">
            <p className="text-[13.5px] text-ink-2">
              This income falls at or below the exemption threshold. No liability arises.
            </p>
          </Card>
        )}

        <div className="mt-4 rounded-[var(--radius-inner)] bg-warn-bg/60 p-4">
          <p className="eyebrow">Not yet wired</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">
            The assessment computes correctly but cannot yet be converted to a payable bill. That lands
            with <span className="font-mono">POST /invoices</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
