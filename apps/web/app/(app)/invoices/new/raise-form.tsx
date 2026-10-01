'use client';

import { useMemo, useState } from 'react';

import { invoiceDueDate, type BillingFrequency as RuleFrequency } from '@igr/tax-rules';
import { Badge, Button, Card, Field, Input, Select, Table, Td, Th, Tr } from '@/components/ui';
import { date, humanise, money } from '@/lib/format';
import type { RevenueHead, Taxpayer } from '@/lib/types';

interface Line {
  headId: string;
  quantity: number;
}

/** Schema enum -> rules-package literal. One conversion, in one place. */
function toRuleFrequency(f: RevenueHead['frequency']): RuleFrequency {
  return f.toLowerCase() as RuleFrequency;
}

export function RaiseInvoiceForm({
  heads,
  taxpayer,
}: {
  heads: RevenueHead[];
  taxpayer: Taxpayer | null;
}) {
  const billable = heads.filter((h) => h.amount > 0);
  const [lines, setLines] = useState<Line[]>([{ headId: billable[0]?.id ?? '', quantity: 1 }]);

  const resolved = lines
    .map((l) => ({ line: l, head: billable.find((h) => h.id === l.headId) }))
    .filter((r): r is { line: Line; head: RevenueHead } => Boolean(r.head));

  const total = resolved.reduce((s, r) => s + r.head.amount * r.line.quantity, 0);

  // The earliest due date across the heads governs the bill — @igr/tax-rules
  // decides that, not this component.
  const dueDate = useMemo(() => {
    if (resolved.length === 0) return null;
    return invoiceDueDate(resolved.map((r) => toRuleFrequency(r.head.frequency)));
  }, [resolved]);

  const setLine = (index: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <div>
          <h2 className="text-[16px] font-semibold">Taxpayer</h2>
        </div>
        <Card className="mt-4">
          {taxpayer ? (
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="text-[14px] font-medium">
                  {taxpayer.businessName ?? `${taxpayer.firstName} ${taxpayer.surname}`}
                </p>
                <p className="tabular text-[12px] text-ink-3">
                  {taxpayer.tin} · {taxpayer.lgaName}
                </p>
              </div>
              <Badge tone="ok">Selected</Badge>
            </div>
          ) : (
            <Field label="Find the taxpayer" hint="Search by name or TIN. A bill cannot be raised against an unregistered party.">
              <Input placeholder="Name or tax identification number" />
            </Field>
          )}
        </Card>

        <div className="mt-6 flex items-baseline justify-between border-b border-rule-2 pb-2">
          <h2 className="text-[16px] font-semibold">Revenue heads</h2>
          <span className="eyebrow">{billable.length} approved and billable</span>
        </div>

        <Table>
          <thead>
            <tr>
              <Th>Revenue head</Th>
              <Th align="right" width="90px">Qty</Th>
              <Th align="right">Unit</Th>
              <Th align="right">Line total</Th>
              <Th width="40px" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => {
              const head = billable.find((h) => h.id === line.headId);
              return (
                <Tr key={i}>
                  <Td>
                    <Select value={line.headId} onChange={(e) => setLine(i, { headId: e.target.value })}>
                      {billable.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.itemCode} · {h.itemName}
                        </option>
                      ))}
                    </Select>
                    {head ? (
                      <span className="mt-1 block text-[11.5px] text-ink-3">
                        {head.mdaName} · {humanise(head.frequency)}
                      </span>
                    ) : null}
                  </Td>
                  <Td align="right">
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => setLine(i, { quantity: Math.max(1, Number(e.target.value)) })}
                      className="text-right"
                    />
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {money(head?.amount ?? 0)}
                  </Td>
                  <Td align="right" mono>
                    {money((head?.amount ?? 0) * line.quantity)}
                  </Td>
                  <Td align="right">
                    {lines.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setLines((prev) => prev.filter((_, k) => k !== i))}
                        aria-label="Remove line"
                        className="text-ink-3 hover:text-danger"
                      >
                        ×
                      </button>
                    ) : null}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>

        <div className="mt-3">
          <Button
            size="sm"
            onClick={() => setLines((prev) => [...prev, { headId: billable[0]?.id ?? '', quantity: 1 }])}
          >
            + Add another revenue head
          </Button>
        </div>
      </div>

      <aside>
        <div>
          <h2 className="text-[16px] font-semibold">Bill</h2>
        </div>
        <Card className="mt-4">
          <p className="eyebrow">Total payable</p>
          <p className="tabular mt-2 text-[28px] tracking-[-0.03em] text-[var(--tenant-accent)]">
            {money(total)}
          </p>

          <dl className="mt-4">
            <div className="flex justify-between border-b border-rule py-2">
              <dt className="text-[13px] text-ink-3">Revenue heads</dt>
              <dd className="tabular text-[13px]">{resolved.length}</dd>
            </div>
            <div className="flex justify-between border-b border-rule py-2">
              <dt className="text-[13px] text-ink-3">Due date</dt>
              <dd className="tabular text-[13px]">{dueDate ? date(dueDate.toISOString()) : '—'}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-[13px] text-ink-3">Governed by</dt>
              <dd className="text-right text-[12.5px] text-ink-2">
                {resolved.length > 1 ? 'Earliest of the heads' : 'The single head'}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="mt-4 rounded-[var(--radius-inner)] bg-warn-bg/60 p-4">
          <p className="eyebrow">Not yet wired</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">
            The bill computes correctly but has nowhere to post to. Invoicing persists once{' '}
            <span className="font-mono">apps/api</span> exposes <span className="font-mono">POST /invoices</span>.
          </p>
        </div>
      </aside>
    </div>
  );
}
