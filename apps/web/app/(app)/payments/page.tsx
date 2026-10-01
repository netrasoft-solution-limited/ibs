import type { Metadata } from 'next';
import Link from 'next/link';

import { listPayments } from '@/lib/api';
import type { PaymentChannel, PaymentStatus } from '@/lib/types';
import { dateTime, humanise, money, moneyShort, number } from '@/lib/format';
import {
  Button,
  EmptyState,
  Field,
  Input,
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
import { requirePermission } from '@/lib/session';

export const metadata: Metadata = { title: 'Payments' };

const STATUSES: PaymentStatus[] = ['SUCCESSFUL', 'PENDING', 'FAILED', 'REVERSED'];
const CHANNELS: PaymentChannel[] = ['PAYSTACK', 'REMITA', 'PAYDIRECT', 'CREDO', 'BANK_BRANCH'];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requirePermission('payment.view');
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const result = await listPayments({
    q: sp.q,
    status: sp.status as PaymentStatus | undefined,
    channel: sp.channel as PaymentChannel | undefined,
    page,
  });

  const settled = result.rows.filter((p) => p.status === 'SUCCESSFUL').reduce((s, p) => s + p.amount, 0);
  const failed = result.rows.filter((p) => p.status === 'FAILED');

  const qs = new URLSearchParams(
    Object.entries(sp).filter(([k, v]) => v && k !== 'page') as [string, string][],
  );
  const baseHref = `/payments${qs.toString() ? `?${qs}` : ''}`;

  return (
    <>
      <PageHeader
        eyebrow="Collection"
        title="Payments and receipts"
        description="Every settlement attempt across all channels, successful or not. The gateway's own reference is retained on each record, which is what makes a duplicate posting impossible rather than merely unlikely."
        actions={
          <>
            {user.permissions.includes('payment.reconcile') ? <Button>Reconcile</Button> : null}
            {user.permissions.includes('payment.record') ? (
              <Button variant="primary">Record in-branch payment</Button>
            ) : null}
          </>
        }
      />

      <TileRow cols={4}>
        <StatTile label="Records in view" value={number(result.total)} sub="Matching the current filters" />
        <StatTile label="Settled (this page)" value={moneyShort(settled)} tone="accent" />
        <StatTile
          label="Failed (this page)"
          value={number(failed.length)}
          sub={failed.length ? `${moneyShort(failed.reduce((s, p) => s + p.amount, 0))} not collected` : 'None'}
          tone={failed.length ? 'danger' : 'default'}
        />
        <StatTile label="Channels" value="5" sub="Four gateways plus in-branch" />
      </TileRow>

      <form method="get" className="mt-5 grid gap-3 rounded-[var(--radius-card)] bg-sunk p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Field label="Search">
            <Input name="q" defaultValue={sp.q ?? ''} placeholder="Reference, receipt, invoice or taxpayer" />
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
        <Field label="Channel">
          <Select name="channel" defaultValue={sp.channel ?? ''}>
            <option value="">All channels</option>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {humanise(c)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="rounded-full bg-deep px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-ink"
          >
            Apply filters
          </button>
          <Link href="/payments" className="px-2 text-[13px] text-ink-3 hover:text-[var(--tenant-accent)]">
            Reset
          </Link>
        </div>
      </form>

      {result.total === 0 ? (
        <EmptyState title="No payment matches those filters." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Reference</Th>
                <Th>Receipt</Th>
                <Th>Invoice</Th>
                <Th>Taxpayer</Th>
                <Th>Channel</Th>
                <Th>Status</Th>
                <Th align="right">Amount</Th>
                <Th align="right">Posted</Th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((p) => (
                <Tr key={p.id}>
                  <Td mono>
                    <Link href={`/payments/${p.id}`} className="hover:text-[var(--tenant-accent)]">
                      {p.reference}
                    </Link>
                  </Td>
                  <Td mono className="text-ink-3">
                    {p.receiptNumber ?? '—'}
                  </Td>
                  <Td mono>
                    <Link href={`/invoices/${p.invoiceId}`} className="hover:text-[var(--tenant-accent)]">
                      {p.invoiceNumber}
                    </Link>
                  </Td>
                  <Td>
                    <span className="text-[12.5px] text-ink-2">{p.taxpayerName}</span>
                  </Td>
                  <Td>
                    <span className="text-[12.5px] text-ink-2">{humanise(p.channel)}</span>
                  </Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  <Td align="right" mono>
                    {money(p.amount)}
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {dateTime(p.paidAt ?? p.createdAt)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} baseHref={baseHref} />
        </>
      )}
    </>
  );
}
