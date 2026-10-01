'use client';

import { useState } from 'react';

import { formatTin } from '@igr/tax-rules';
import { Card, Field, Input, Select } from '@/components/ui';
import type { Lga, TaxpayerCategory } from '@/lib/types';

const CATEGORIES: Array<{ value: TaxpayerCategory; label: string; hint: string }> = [
  { value: 'INDIVIDUAL', label: 'Individual', hint: 'A person assessed in their own name' },
  { value: 'CORPORATE', label: 'Corporate', hint: 'A registered company or business' },
  { value: 'STATE_AGENCY', label: 'State agency', hint: 'A body of the state government' },
  { value: 'FEDERAL_AGENCY', label: 'Federal agency', hint: 'A federal body operating in the state' },
];

export function RegisterTaxpayerForm({ lgas }: { lgas: Lga[] }) {
  const [category, setCategory] = useState<TaxpayerCategory>('INDIVIDUAL');
  const [lgaId, setLgaId] = useState(lgas[0]?.id ?? '');

  const isPerson = category === 'INDIVIDUAL';
  const lga = lgas.find((l) => l.id === lgaId);

  // The serial is assigned by the database on insert; this shows the shape.
  const tinPreview = lga
    ? formatTin({ year: new Date().getFullYear(), lgaCode: lga.code, serial: '·····' })
    : '—';

  return (
    <form className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <div>
          <div>
            <h2 className="text-[16px] font-semibold">Who is being registered</h2>
          </div>
          <Card className="mt-4 space-y-4">
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value as TaxpayerCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label} — {c.hint}
                  </option>
                ))}
              </Select>
            </Field>

            {isPerson ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name">
                  <Input name="firstName" required placeholder="Aisha" />
                </Field>
                <Field label="Surname">
                  <Input name="surname" required placeholder="Mohammed" />
                </Field>
              </div>
            ) : (
              <Field label="Registered name" hint="Exactly as it appears on the incorporation or establishment instrument.">
                <Input name="businessName" required placeholder="Nasara Ventures Limited" />
              </Field>
            )}
          </Card>
        </div>

        <div>
          <div>
            <h2 className="text-[16px] font-semibold">Contact</h2>
          </div>
          <Card className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email address" hint="Verified by a one-time code. Must be unique.">
                <Input name="email" type="email" required placeholder="name@example.ng" />
              </Field>
              <Field label="Phone number" hint="Must be unique on the register.">
                <Input name="phone" required placeholder="08030000000" />
              </Field>
            </div>
            <Field label="Address">
              <Input name="address" placeholder="24 Jos Road, Lafia" />
            </Field>
          </Card>
        </div>

        <div>
          <div>
            <h2 className="text-[16px] font-semibold">Where they are liable</h2>
          </div>
          <Card className="mt-4">
            <Field label="Local government area" hint="The two-digit code becomes part of the identifier.">
              <Select value={lgaId} onChange={(e) => setLgaId(e.target.value)}>
                {lgas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} · {l.name}
                  </option>
                ))}
              </Select>
            </Field>
          </Card>
        </div>
      </div>

      <aside>
        <div>
          <h2 className="text-[16px] font-semibold">Identifier</h2>
        </div>
        <Card className="mt-4">
          <p className="eyebrow">Tax identification number</p>
          <p className="tabular mt-2 text-[24px] tracking-[-0.02em] text-[var(--tenant-accent)]">{tinPreview}</p>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
            Two-digit year, then the two-digit code for {lga?.name ?? 'the selected area'}, then a serial
            assigned on insert. Uniqueness is enforced by the database, not by this screen.
          </p>
        </Card>

        <Card className="mt-4 bg-warn-bg/60">
          <p className="text-[12.5px] leading-relaxed text-ink-2">
            Registration is not complete until the request has passed the three-stage review. The record is
            created immediately; the identifier is issued at approval.
          </p>
        </Card>

        <div className="mt-4 rounded-[var(--radius-inner)] bg-warn-bg/60 p-4">
          <p className="eyebrow">Not yet wired</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">
            This form is complete but has nowhere to post to. Registration persists once{' '}
            <span className="font-mono">apps/api</span> exposes <span className="font-mono">POST /taxpayers</span>.
          </p>
        </div>
      </aside>
    </form>
  );
}
