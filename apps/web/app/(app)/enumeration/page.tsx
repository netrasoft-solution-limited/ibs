import type { Metadata } from 'next';

import { listEnumerationAgents } from '@/lib/api';
import { requirePermission } from '@/lib/session';
import { dateTime, number, percent } from '@/lib/format';
import { Badge, Card, PageHeader, Section, StatTile, Table, Td, Th, TileRow, Tr } from '@/components/ui';

export const metadata: Metadata = { title: 'Field enumeration' };

export default async function EnumerationPage() {
  await requirePermission('enumeration.manage');
  const agents = await listEnumerationAgents();

  const target = agents.reduce((s, a) => s + a.monthlyTarget, 0);
  const captured = agents.reduce((s, a) => s + a.capturedThisMonth, 0);
  const total = agents.reduce((s, a) => s + a.capturedTotal, 0);
  const invoices = agents.reduce((s, a) => s + a.invoicesRaised, 0);

  return (
    <>
      <PageHeader
        eyebrow="Revenue administration"
        title="Field enumeration"
        description="Agents capture individuals, businesses and properties on site and raise a bill there and then. Every record is attributed to the agent who captured it, and progress is read against a monthly target."
      />

      <TileRow cols={4}>
        <StatTile
          label="Captured this month"
          value={number(captured)}
          sub={`${percent((captured / target) * 100, 0)} of ${number(target)} target`}
          tone="accent"
        />
        <StatTile label="Agents in the field" value={number(agents.length)} />
        <StatTile label="Records captured, all time" value={number(total)} />
        <StatTile label="Bills raised on site" value={number(invoices)} />
      </TileRow>

      <Section title="Agents" hint="Ranked by captures this month">
        <Table>
          <thead>
            <tr>
              <Th>Agent</Th>
              <Th>Area</Th>
              <Th align="right">Target</Th>
              <Th align="right">This month</Th>
              <Th align="right">Progress</Th>
              <Th align="right">All time</Th>
              <Th align="right">Bills raised</Th>
              <Th align="right">Last sync</Th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => {
              const pct = (a.capturedThisMonth / a.monthlyTarget) * 100;
              return (
                <Tr key={a.userId}>
                  <Td>
                    <span className="font-medium">{a.name}</span>
                  </Td>
                  <Td>
                    <span className="text-[12.5px] text-ink-2">{a.lgaName}</span>
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {number(a.monthlyTarget)}
                  </Td>
                  <Td align="right" mono>
                    {number(a.capturedThisMonth)}
                  </Td>
                  <Td align="right">
                    <Badge tone={pct >= 100 ? 'ok' : pct >= 70 ? 'warn' : 'danger'}>{percent(pct, 0)}</Badge>
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {number(a.capturedTotal)}
                  </Td>
                  <Td align="right" mono>
                    {number(a.invoicesRaised)}
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {dateTime(a.lastSyncAt)}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Section>

      <Card className="mt-6 bg-warn-bg/60">
        <p className="text-[12.5px] leading-relaxed text-ink-2">
          Enumeration widens the roll, which is the only lever that raises revenue without raising a rate.
          Register widening (capability 23) reads these captures against the existing register to catch the
          same business being enumerated twice under slightly different names.
        </p>
      </Card>
    </>
  );
}
