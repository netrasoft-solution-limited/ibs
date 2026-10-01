import type { Metadata } from 'next';
import Link from 'next/link';

import { listDemandNotices } from '@/lib/api';
import { requirePermission } from '@/lib/session';
import { date, dueLabel, humanise, money, moneyShort, number } from '@/lib/format';
import {
  Card,
  EmptyState,
  Field,
  Input,
  LinkButton,
  PageHeader,
  Pagination,
  Select,
  StatTile,
  StatusBadge,
  Table,
  Td,
  Th,
  TileRow,
  Tr,
} from '@/components/ui';

export const metadata: Metadata = { title: 'Demand notices' };

const STATUSES = ['SERVED', 'PART_SETTLED', 'SETTLED', 'ESCALATED', 'WITHDRAWN'];

export default async function DemandNoticesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('demand.issue');
  const sp = await searchParams;

  const [result, all] = await Promise.all([
    listDemandNotices({ q: sp.q, status: sp.status, page: Number(sp.page ?? 1) }),
    listDemandNotices({ page: 1 }),
  ]);

  const served = await listDemandNotices({ status: 'SERVED' });
  const escalated = await listDemandNotices({ status: 'ESCALATED' });
  const outstanding = result.rows.reduce((s, n) => s + (n.amount - n.amountSettled), 0);

  const qs = new URLSearchParams(
    Object.entries(sp).filter(([k, v]) => v && k !== 'page') as [string, string][],
  );
  const baseHref = `/demand-notices${qs.toString() ? `?${qs}` : ''}`;

  return (
    <>
      <PageHeader
        eyebrow="Billing & collection"
        title="Demand notices"
        description="Notice served against outstanding liability, with a settlement position on every notice. A notice is the step between a bill that was ignored and enforcement."
        actions={
          <LinkButton href="/intelligence" variant="primary">
            Build from risk worklist
          </LinkButton>
        }
      />

      <TileRow cols={4}>
        <StatTile label="Notices issued" value={number(all.total)} sub="All time" />
        <StatTile label="Served, unsettled" value={number(served.total)} tone="accent" />
        <StatTile
          label="Escalated"
          value={number(escalated.total)}
          sub="Beyond notice stage"
          tone={escalated.total ? 'danger' : 'default'}
        />
        <StatTile label="Outstanding (this page)" value={moneyShort(outstanding)} />
      </TileRow>

      <form method="get" className="mt-5 grid gap-3 rounded-[var(--radius-card)] bg-sunk p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Field label="Search">
            <Input name="q" defaultValue={sp.q ?? ''} placeholder="Notice number, taxpayer or TIN" />
          </Field>
        </div>
        <Field label="Status">
          <Select name="status" defaultValue={sp.status ?? ''}>
            <option value="">Any status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {humanise(s)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-full bg-deep px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-ink"
          >
            Apply
          </button>
          <Link href="/demand-notices" className="px-2 pb-2 text-[13px] text-ink-3 hover:text-[var(--tenant-accent)]">
            Reset
          </Link>
        </div>
      </form>

      {result.total === 0 ? (
        <EmptyState title="No demand notice matches those filters." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Notice</Th>
                <Th>Taxpayer</Th>
                <Th align="right">Bills</Th>
                <Th align="right">Demanded</Th>
                <Th align="right">Settled</Th>
                <Th>Status</Th>
                <Th align="right">Due</Th>
                <Th>Issued by</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {result.rows.map((n) => {
                const due = dueLabel(n.dueAt);
                const chasing = n.status === 'SERVED' || n.status === 'PART_SETTLED';
                return (
                  <Tr key={n.id}>
                    <Td mono>{n.noticeNumber}</Td>
                    <Td>
                      <Link href={`/taxpayers/${n.taxpayerId}`} className="hover:text-[var(--tenant-accent)]">
                        {n.taxpayerName}
                      </Link>
                      <span className="tabular block text-[11.5px] text-ink-3">{n.taxpayerTin}</span>
                    </Td>
                    <Td align="right" mono>
                      {n.invoiceCount}
                    </Td>
                    <Td align="right" mono>
                      {money(n.amount)}
                    </Td>
                    <Td align="right" mono className="text-ink-3">
                      {money(n.amountSettled)}
                    </Td>
                    <Td>
                      <StatusBadge status={n.status} />
                    </Td>
                    <Td align="right" mono className={chasing && due.overdue ? 'text-danger' : 'text-ink-3'}>
                      {date(n.dueAt)}
                      {chasing ? <span className="block text-[10.5px]">{due.text}</span> : null}
                    </Td>
                    <Td>
                      <span className="text-[12.5px] text-ink-2">{n.issuedByName}</span>
                    </Td>
                    <Td align="right">
                      <LinkButton size="sm" href={`/print/notice/${n.noticeNumber}`}>
                        Print
                      </LinkButton>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>

          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} baseHref={baseHref} />
        </>
      )}

      <Card className="mt-6 bg-warn-bg/60">
        <p className="text-[12.5px] leading-relaxed text-ink-2">
          A notice is served against bills that already exist — it does not create liability. The amount
          demanded is the sum of the unpaid balances on the bills it cites, so a notice can never demand
          more than the register says is owed.
        </p>
      </Card>
    </>
  );
}
