import type { Metadata } from 'next';
import Link from 'next/link';

import { getDashboardSummary } from '@/lib/api';
import { requirePermission, requireUser } from '@/lib/session';
import { money, moneyShort, number, percent } from '@/lib/format';
import { BarRow, Card, PageHeader, Section, StatTile, TileRow } from '@/components/ui';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  await requirePermission('analytics.view');
  const user = await requireUser();
  const s = await getDashboardSummary(user);

  const maxMonth = Math.max(...s.monthly.map((m) => Math.max(m.collected, m.expected)), 1);
  const maxMda = Math.max(...s.byMda.map((m) => m.collected), 1);
  const maxLga = Math.max(...s.byLga.map((l) => l.collected), 1);
  const attainment = s.targetYtd > 0 ? (s.collectedYtd / s.targetYtd) * 100 : 0;

  return (
    <>
      <PageHeader
        eyebrow="Oversight"
        title={`Good day, ${user.fullName.split(' ')[0]}`}
        description="Performance against target, what is outstanding, and where it is owed. Every figure is drawn from posted transactions, not from a separate reporting copy."
      />

      <TileRow cols={5}>
        <StatTile
          label="Collected year to date"
          value={moneyShort(s.collectedYtd)}
          sub={`${percent(attainment)} of ${moneyShort(s.targetYtd)} target`}
          tone="accent"
        />
        <StatTile label="Outstanding" value={moneyShort(s.outstanding)} sub="Unpaid and part-paid bills" tone="danger" />
        <StatTile
          label="Compliance rate"
          value={percent(s.complianceRate)}
          sub={`${number(s.invoicesPaid)} of ${number(s.invoicesRaised)} bills settled`}
        />
        <StatTile label="Taxpayers on the roll" value={number(s.taxpayers)} sub={`${number(s.activeTaxpayers)} active with a TIN`} />
        <StatTile label="Bills raised" value={number(s.invoicesRaised)} sub="All types, all offices" />
      </TileRow>

      <Section title="Expected against collected" hint="Trailing twelve months">
        <Card className="mt-4">
          <div className="scroll-x">
            <div className="flex min-w-[620px] items-end gap-2" style={{ height: 190 }}>
              {s.monthly.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-[150px] w-full items-end justify-center gap-[3px]">
                    {/* Expected sits behind as a target line the bar must reach. */}
                    <div
                      className="hatch w-1/3 rounded-t-[4px] bg-sunk"
                      style={{ height: `${(m.expected / maxMonth) * 100}%` }}
                      title={`Expected ${money(m.expected)}`}
                    />
                    <div
                      className="w-1/3 rounded-t-[4px] bg-[var(--tenant-accent)]"
                      style={{ height: `${(m.collected / maxMonth) * 100}%` }}
                      title={`Collected ${money(m.collected)}`}
                    />
                  </div>
                  <span className="text-[10.5px] text-ink-3">{m.month}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 flex items-center gap-4 eyebrow">
            <span className="flex items-center gap-1.5">
              <span className="hatch inline-block h-2 w-2 rounded-full bg-sunk" /> Expected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--tenant-accent)]" /> Collected
            </span>
          </p>
        </Card>
      </Section>

      <div className="mt-9 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-[16px] font-semibold">Collection by agency</h2>
            <span className="eyebrow">Top 8</span>
          </div>
          <Card className="mt-4">
            {s.byMda.map((m) => (
              <BarRow key={m.name} label={m.name} value={m.collected} max={maxMda} formatted={moneyShort(m.collected)} />
            ))}
          </Card>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-[16px] font-semibold">Collection by local government area</h2>
            <span className="eyebrow">13 areas</span>
          </div>
          <Card className="mt-4">
            {s.byLga.slice(0, 8).map((l) => (
              <BarRow
                key={l.name}
                label={`${l.name} · ${number(l.taxpayers)} taxpayers`}
                value={l.collected}
                max={maxLga}
                formatted={moneyShort(l.collected)}
              />
            ))}
          </Card>
        </div>
      </div>

      <Section title="Largest outstanding balances" hint="Ranked by amount owed">
        <Card className="mt-4">
          {s.topDefaulters.map((d) => (
            <div key={d.id} className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5 last:border-b-0">
              <div className="min-w-0">
                <Link href={`/taxpayers/${d.id}`} className="truncate text-[13.5px] text-ink hover:text-[var(--tenant-accent)]">
                  {d.name}
                </Link>
                <p className="tabular text-[11.5px] text-ink-3">{d.tin}</p>
              </div>
              <span className="tabular shrink-0 text-[13.5px] text-danger">{money(d.outstanding)}</span>
            </div>
          ))}
        </Card>
      </Section>
    </>
  );
}
