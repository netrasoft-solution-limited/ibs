import type { Metadata } from 'next';

import { listTaxOffices } from '@/lib/api';
import { requirePermission } from '@/lib/session';
import { money, moneyShort, number, percent } from '@/lib/format';
import { Badge, Card, PageHeader, Section, StatTile, Table, Td, Th, TileRow, Tr } from '@/components/ui';

export const metadata: Metadata = { title: 'Tax offices' };

export default async function TaxOfficesPage() {
  await requirePermission('office.manage');
  const offices = await listTaxOffices();

  const monthTarget = offices.reduce((s, o) => s + o.monthlyTarget, 0);
  const monthCollected = offices.reduce((s, o) => s + o.monthCollected, 0);
  const staff = offices.reduce((s, o) => s + o.staffCount, 0);
  const behind = offices.filter((o) => o.monthCollected < o.monthlyTarget).length;

  const zones = Array.from(new Set(offices.map((o) => o.zone)));

  return (
    <>
      <PageHeader
        eyebrow="Revenue administration"
        title="Area tax offices"
        description="Monthly revenue targets are set for each office; annual targets follow from them. Performance is read against target, by office and by zone — a ranking the Service can act on rather than a table it has to interpret."
      />

      <TileRow cols={4}>
        <StatTile
          label="Attainment this month"
          value={percent((monthCollected / monthTarget) * 100)}
          sub={`${moneyShort(monthCollected)} of ${moneyShort(monthTarget)}`}
          tone="accent"
        />
        <StatTile label="Offices" value={number(offices.length)} sub={`Across ${zones.length} zones`} />
        <StatTile
          label="Behind target"
          value={number(behind)}
          sub="Below their monthly figure"
          tone={behind ? 'danger' : 'default'}
        />
        <StatTile label="Staff assigned" value={number(staff)} sub="Across all offices" />
      </TileRow>

      <Section title="Performance against target" hint="Ranked by attainment">
        <Table>
          <thead>
            <tr>
              <Th>Office</Th>
              <Th>Zone</Th>
              <Th>Manager</Th>
              <Th align="right">Staff</Th>
              <Th align="right">Monthly target</Th>
              <Th align="right">Collected</Th>
              <Th align="right">Attainment</Th>
              <Th align="right">Year to date</Th>
            </tr>
          </thead>
          <tbody>
            {offices.map((o) => {
              const pct = (o.monthCollected / o.monthlyTarget) * 100;
              return (
                <Tr key={o.id}>
                  <Td>
                    <span className="font-medium">{o.name}</span>
                    <span className="block text-[11.5px] text-ink-3">{o.lgaName}</span>
                  </Td>
                  <Td>
                    <span className="text-[12.5px] text-ink-2">{o.zone}</span>
                  </Td>
                  <Td>
                    <span className="text-[12.5px] text-ink-2">{o.managerName}</span>
                  </Td>
                  <Td align="right" mono>
                    {o.staffCount}
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {money(o.monthlyTarget)}
                  </Td>
                  <Td align="right" mono>
                    {money(o.monthCollected)}
                  </Td>
                  <Td align="right">
                    <Badge tone={pct >= 100 ? 'ok' : pct >= 80 ? 'warn' : 'danger'}>{percent(pct, 0)}</Badge>
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {moneyShort(o.ytdCollected)}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Section>

      <Section title="By zone" hint={`${zones.length} zones`}>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {zones.map((zone) => {
            const inZone = offices.filter((o) => o.zone === zone);
            const t = inZone.reduce((s, o) => s + o.monthlyTarget, 0);
            const c = inZone.reduce((s, o) => s + o.monthCollected, 0);
            const pct = (c / t) * 100;
            return (
              <Card key={zone}>
                <p className="eyebrow">{zone}</p>
                <p className="tabular mt-2 text-[24px] leading-none font-semibold">{percent(pct, 0)}</p>
                <p className="mt-2 text-[12px] text-ink-3">
                  {moneyShort(c)} of {moneyShort(t)} · {inZone.length} offices
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-rule">
                  <div
                    className="h-full rounded-full bg-[var(--tenant-accent)]"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </Section>
    </>
  );
}
