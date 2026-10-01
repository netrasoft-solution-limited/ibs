import type { Metadata } from 'next';
import Link from 'next/link';

import { listCapturesByAgent, listEnumerationAgents } from '@/lib/api';
import { requirePermission } from '@/lib/session';
import { date, money, number, percent, taxpayerName } from '@/lib/format';
import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  Section,
  StatTile,
  StatusBadge,
  TileRow,
} from '@/components/ui';

export const metadata: Metadata = { title: 'Field capture' };

/**
 * The enumeration agent's own screen.
 *
 * Deliberately not the state-wide register: an agent works one area on a phone,
 * and showing them 260 taxpayers with filters and pagination is showing them
 * someone else's job. Cards rather than a table, for the same reason.
 */
export default async function FieldPage() {
  const user = await requirePermission('enumeration.field');

  const agents = await listEnumerationAgents();
  const me = agents.find((a) => a.userId === user.id) ?? agents[0];
  const captures = me ? await listCapturesByAgent(me.userId) : [];

  const pct = me ? (me.capturedThisMonth / me.monthlyTarget) * 100 : 0;
  const remaining = me ? Math.max(0, me.monthlyTarget - me.capturedThisMonth) : 0;

  return (
    <>
      <PageHeader
        eyebrow={me ? `${me.lgaName} · field agent` : 'Field agent'}
        title="Capture"
        description="Your area, your captures, your target. Register a taxpayer on site and raise the bill before you leave."
        actions={
          <>
            <LinkButton href="/taxpayers/new" variant="primary">
              Capture a taxpayer
            </LinkButton>
            <LinkButton href="/invoices/new">Raise a bill</LinkButton>
          </>
        }
      />

      <TileRow cols={4}>
        <StatTile
          label="Captured this month"
          value={number(me?.capturedThisMonth)}
          sub={`Target ${number(me?.monthlyTarget)}`}
          tone="accent"
        />
        <StatTile label="Progress" value={percent(pct, 0)} sub={remaining ? `${number(remaining)} to go` : 'Target met'} />
        <StatTile label="All time" value={number(me?.capturedTotal)} sub="Records attributed to you" />
        <StatTile label="Bills raised" value={number(me?.invoicesRaised)} sub="On site" />
      </TileRow>

      <Card className="mt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-[13.5px] font-medium">This month against target</p>
          <p className="tabular text-[13px] text-ink-3">
            {number(me?.capturedThisMonth)} / {number(me?.monthlyTarget)}
          </p>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-rule">
          <div
            className="h-full rounded-full bg-[var(--tenant-accent)]"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </Card>

      <Section title="Your recent captures" hint={`${number(captures.length)} records`}>
        {captures.length === 0 ? (
          <EmptyState
            title="You have not captured anything this month."
            hint="Records you register in the field appear here, attributed to you."
          />
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {captures.slice(0, 24).map((t) => (
              <Link
                key={t.id}
                href={`/taxpayers/${t.id}`}
                className="rounded-[var(--radius-card)] bg-sunk p-4 transition-colors hover:bg-rule/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium">{taxpayerName(t)}</p>
                    <p className="tabular text-[11.5px] text-ink-3">{t.tin}</p>
                  </div>
                  <StatusBadge status={t.tinStatus} />
                </div>

                <p className="mt-2.5 line-clamp-2 text-[12px] text-ink-3">{t.address}</p>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-rule-2 pt-2.5">
                  <span className="text-[11.5px] text-ink-3">Captured {date(t.createdAt)}</span>
                  {(t.outstandingAmount ?? 0) > 0 ? (
                    <Badge tone="danger">{money(t.outstandingAmount)}</Badge>
                  ) : (
                    <Badge tone="ok">Settled</Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Card className="mt-6 bg-warn-bg/60">
        <p className="text-[12.5px] leading-relaxed text-ink-2">
          You see your own captures and your own area. The state-wide register, other agents' figures and
          collection performance are not yours to read — which is enforced by the permissions on your
          account, not by this screen choosing what to show.
        </p>
      </Card>
    </>
  );
}
