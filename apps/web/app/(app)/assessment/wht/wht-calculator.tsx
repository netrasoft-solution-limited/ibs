'use client';

import { useMemo, useState } from 'react';

import { computeWht, listWhtCategories, type RecipientType, type WhtCategory } from '@igr/tax-rules';
import { Card, Field, Input, Select, StatTile, Table, Td, Th, TileRow, Tr } from '@/components/ui';
import { money } from '@/lib/format';

const CATEGORIES = listWhtCategories();

export function WhtCalculator() {
  const [amount, setAmount] = useState(2_500_000);
  const [category, setCategory] = useState<WhtCategory>('consultancy');
  const [recipientType, setRecipientType] = useState<RecipientType>('company');

  const result = useMemo(
    () => computeWht(amount, category, recipientType),
    [amount, category, recipientType],
  );

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
      <div>
        <div>
          <h2 className="text-[16px] font-semibold">Transaction</h2>
        </div>
        <Card className="mt-4 space-y-4">
          <Field label="Transaction amount" hint="Gross, before deduction.">
            <Input
              type="number"
              min={0}
              step={10_000}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            />
          </Field>

          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as WhtCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Recipient" hint="Several categories carry a higher rate for companies.">
            <Select
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value as RecipientType)}
            >
              <option value="individual">Individual</option>
              <option value="company">Company</option>
            </Select>
          </Field>
        </Card>

        <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
          Every deduction recorded here names a counterparty, which makes each filing a statement about
          another party's income. That is what the third-party matching capability reads.
        </p>
      </div>

      <div>
        <div>
          <h2 className="text-[16px] font-semibold">Deduction</h2>
        </div>

        <TileRow cols={3}>
          <StatTile label="Withholding tax due" value={money(result.whtDue)} tone="accent" />
          <StatTile label="Net paid to recipient" value={money(result.netPayment)} />
          <StatTile label="Rate applied" value={`${(result.rate * 100).toFixed(0)}%`} sub={result.label} />
        </TileRow>

        <div className="mt-6">
          <h2 className="text-[16px] font-semibold">Rate schedule</h2>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Category</Th>
              <Th align="right">Individual</Th>
              <Th align="right">Company</Th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((c) => {
              const active = c.key === category;
              return (
                <Tr key={c.key}>
                  <Td className={active ? 'font-medium text-[var(--tenant-accent)]' : ''}>{c.label}</Td>
                  <Td
                    align="right"
                    mono
                    className={active && recipientType === 'individual' ? 'font-medium text-[var(--tenant-accent)]' : ''}
                  >
                    {(c.individual * 100).toFixed(0)}%
                  </Td>
                  <Td
                    align="right"
                    mono
                    className={active && recipientType === 'company' ? 'font-medium text-[var(--tenant-accent)]' : ''}
                  >
                    {(c.company * 100).toFixed(0)}%
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
