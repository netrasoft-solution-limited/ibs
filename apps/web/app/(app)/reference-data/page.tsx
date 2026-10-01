import type { Metadata } from 'next';

import { listLgas, listPresumptiveSchedules } from '@/lib/api';
import { humanise, money, number } from '@/lib/format';
import { Card, PageHeader, Section, StatTile, Table, Td, Th, TileRow, Tr } from '@/components/ui';
import { requirePermission } from '@/lib/session';

export const metadata: Metadata = { title: 'Reference data' };

export default async function ReferenceDataPage() {
  await requirePermission('referencedata.manage');
  const [lgas, schedules] = await Promise.all([listLgas(), listPresumptiveSchedules()]);
  const totalTaxpayers = lgas.reduce((s, l) => s + (l.taxpayerCount ?? 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Revenue administration"
        title="Reference data"
        description="Local government areas, business types and the presumptive amounts the Service has set for each. This is tenant data, not a hard-coded table — which is what allows one deployment to serve more than one state."
      />

      <TileRow cols={4}>
        <StatTile label="Local government areas" value={number(lgas.length)} sub="Each with a two-digit code" />
        <StatTile label="Taxpayers assigned" value={number(totalTaxpayers)} tone="accent" />
        <StatTile label="Business types" value={number(schedules.length)} sub="With presumptive amounts set" />
        <StatTile label="Presumptive bands" value="3" sub="Micro, small and medium" />
      </TileRow>

      <Section title="Local government areas" hint="The code forms part of every TIN">
        <Table>
          <thead>
            <tr>
              <Th width="90px">Code</Th>
              <Th>Local government area</Th>
              <Th align="right">Taxpayers on the roll</Th>
              <Th align="right">Share of roll</Th>
            </tr>
          </thead>
          <tbody>
            {lgas.map((l) => (
              <Tr key={l.id}>
                <Td mono>{l.code}</Td>
                <Td>{l.name}</Td>
                <Td align="right" mono>
                  {number(l.taxpayerCount)}
                </Td>
                <Td align="right" mono className="text-ink-3">
                  {totalTaxpayers ? `${(((l.taxpayerCount ?? 0) / totalTaxpayers) * 100).toFixed(1)}%` : '—'}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Section>

      <Section title="Presumptive schedule" hint="Amounts set by the Service, bands set by policy">
        <Table>
          <thead>
            <tr>
              <Th>Business type</Th>
              <Th align="right">Micro · 1–9 staff</Th>
              <Th align="right">Small · 10–29 staff</Th>
              <Th align="right">Medium · 30–50 staff</Th>
              <Th>Frequency</Th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <Tr key={s.id}>
                <Td>{s.businessType}</Td>
                <Td align="right" mono>
                  {money(s.micro)}
                </Td>
                <Td align="right" mono>
                  {money(s.small)}
                </Td>
                <Td align="right" mono>
                  {money(s.medium)}
                </Td>
                <Td>
                  <span className="text-[12.5px] text-ink-2">{humanise(s.frequency)}</span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>

        <Card className="mt-5 bg-warn-bg/60">
          <h3 className="text-[15px]">Where the line sits between policy and configuration</h3>
          <p className="mt-1.5 max-w-[72ch] text-[13px] leading-relaxed text-ink-2">
            The bands themselves — micro at 1 to 9 staff, small at 10 to 29, medium at 30 to 50 — are
            policy and live in <span className="font-mono">@igr/tax-rules</span>. The amounts in this table
            are the Service's own and are configured here. A business with more than 50 staff falls outside
            presumptive assessment entirely and is refused by the rules engine rather than silently banded.
          </p>
        </Card>
      </Section>
    </>
  );
}
