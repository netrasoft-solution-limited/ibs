import type { Metadata } from 'next';
import Link from 'next/link';

import { getTaxpayer, listInvoices } from '@/lib/api';
import type { InvoiceStatus, InvoiceType } from '@/lib/types';
import { date, dueLabel, humanise, money, moneyShort, number, taxpayerName } from '@/lib/format';
import {
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
import { requirePermission } from '@/lib/session';

export const metadata: Metadata = { title: 'Invoices' };

const STATUSES: InvoiceStatus[] = ['UNPAID', 'PART_PAID', 'PAID', 'CANCELLED', 'EXPIRED'];
const TYPES: InvoiceType[] = [
  'DIRECT', 'DIRECT_ASSESSMENT', 'DEMAND_NOTICE', 'PRESUMPTIVE', 'TCC', 'PAYE', 'APPLICABLE',
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('invoice.view');
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const result = await listInvoices({
    q: sp.q,
    status: sp.status as InvoiceStatus | undefined,
    type: sp.type as InvoiceType | undefined,
    taxpayerId: sp.taxpayerId,
    page,
  });

  // When scoped to one taxpayer, say whose bills these are.
  const scoped = sp.taxpayerId ? await getTaxpayer(sp.taxpayerId) : null;

  const billed = result.rows.reduce((s, i) => s + i.totalAmount, 0);
  const collected = result.rows.reduce((s, i) => s + i.amountPaid, 0);

  const qs = new URLSearchParams(
    Object.entries(sp).filter(([k, v]) => v && k !== 'page') as [string, string][],
  );
  const baseHref = `/invoices${qs.toString() ? `?${qs}` : ''}`;

  return (
    <>
      <PageHeader
        eyebrow="Billing"
        title={scoped ? `Bills — ${taxpayerName(scoped)}` : 'Invoice register'}
        description="Every bill raised in the state, of every type, with what has settled against it. An invoice number is all a taxpayer needs to pay."
        actions={
          <LinkButton href="/invoices/new" variant="primary">
            Raise invoice
          </LinkButton>
        }
      />

      <TileRow cols={4}>
        <StatTile label="Bills in view" value={number(result.total)} sub="Matching the current filters" />
        <StatTile label="Billed (this page)" value={moneyShort(billed)} sub={`${number(result.rows.length)} bills shown`} />
        <StatTile label="Settled (this page)" value={moneyShort(collected)} tone="accent" />
        <StatTile
          label="Outstanding (this page)"
          value={moneyShort(billed - collected)}
          tone={billed - collected > 0 ? 'danger' : 'default'}
        />
      </TileRow>

      <form method="get" className="mt-5 grid gap-3 rounded-[var(--radius-card)] bg-sunk p-4 sm:grid-cols-2 lg:grid-cols-4">
        {sp.taxpayerId ? <input type="hidden" name="taxpayerId" value={sp.taxpayerId} /> : null}
        <div className="lg:col-span-2">
          <Field label="Search">
            <Input name="q" defaultValue={sp.q ?? ''} placeholder="Invoice number, taxpayer or TIN" />
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
        <Field label="Bill type">
          <Select name="type" defaultValue={sp.type ?? ''}>
            <option value="">All 7 types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {humanise(t)}
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
          <Link href="/invoices" className="px-2 text-[13px] text-ink-3 hover:text-[var(--tenant-accent)]">
            Reset
          </Link>
        </div>
      </form>

      {result.total === 0 ? (
        <EmptyState title="No bill matches those filters." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Invoice</Th>
                <Th>Taxpayer</Th>
                <Th>Type</Th>
                <Th align="right">Amount</Th>
                <Th align="right">Paid</Th>
                <Th>Status</Th>
                <Th align="right">Due</Th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((inv) => {
                const due = dueLabel(inv.dueDate);
                const chasing = inv.status === 'UNPAID' || inv.status === 'PART_PAID';
                return (
                  <Tr key={inv.id}>
                    <Td mono>
                      <Link href={`/invoices/${inv.id}`} className="hover:text-[var(--tenant-accent)]">
                        {inv.invoiceNumber}
                      </Link>
                    </Td>
                    <Td>
                      <Link href={`/taxpayers/${inv.taxpayerId}`} className="hover:text-[var(--tenant-accent)]">
                        {inv.taxpayerName}
                      </Link>
                      <span className="tabular block text-[11.5px] text-ink-3">{inv.taxpayerTin}</span>
                    </Td>
                    <Td>
                      <span className="text-[12.5px] text-ink-2">{humanise(inv.type)}</span>
                    </Td>
                    <Td align="right" mono>
                      {money(inv.totalAmount)}
                    </Td>
                    <Td align="right" mono className="text-ink-3">
                      {money(inv.amountPaid)}
                    </Td>
                    <Td>
                      <StatusBadge status={inv.status} />
                    </Td>
                    <Td align="right" mono className={chasing && due.overdue ? 'text-danger' : 'text-ink-3'}>
                      {date(inv.dueDate)}
                      {chasing ? (
                        <span className={`block text-[10.5px] ${due.overdue ? 'text-danger' : 'text-ink-3'}`}>
                          {due.text}
                        </span>
                      ) : null}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>

          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} baseHref={baseHref} />
        </>
      )}
    </>
  );
}
