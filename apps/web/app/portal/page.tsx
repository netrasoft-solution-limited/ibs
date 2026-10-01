import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { logoutAction } from '../actions';
import { getTaxpayer, getTenant, listInvoicesForTaxpayer } from '@/lib/api';
import { getCurrentUser } from '@/lib/session';
import { date, dueLabel, humanise, money, number, taxpayerName } from '@/lib/format';
import { Card, EmptyState, PageHeader, Section, StatTile, StatusBadge, Table, Td, Th, TileRow, Tr } from '@/components/ui';

export const metadata: Metadata = { title: 'My tax account' };

/**
 * The taxpayer's own view. Deliberately outside the staff shell: a taxpayer
 * sees their record and nothing else, so they get no navigation into it.
 */
export default async function PortalPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.type !== 'TAXPAYER') redirect('/dashboard');

  const tenant = await getTenant();
  const taxpayer = user.taxpayerId ? await getTaxpayer(user.taxpayerId) : null;
  const invoices = taxpayer ? await listInvoicesForTaxpayer(taxpayer.id) : [];

  const outstanding = invoices
    .filter((i) => i.status === 'UNPAID' || i.status === 'PART_PAID')
    .reduce((s, i) => s + (i.totalAmount - i.amountPaid), 0);
  const paid = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const overdue = invoices.filter(
    (i) => (i.status === 'UNPAID' || i.status === 'PART_PAID') && new Date(i.dueDate) < new Date(),
  );

  return (
    <div className="min-h-screen bg-page">
      <header className="px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 rounded-full bg-raised px-5 py-3 shadow-soft">
          <Link href="/portal" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-deep text-[13px] font-semibold text-white">
              {tenant.theme.crestInitials}
            </span>
            <span>
              <span className="block text-[14px] font-medium leading-tight">My tax account</span>
              <span className="block text-[11.5px] text-ink-3">
                {tenant.shortName}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-ink-2">{user.fullName}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full bg-raised px-4 py-2 text-[12.5px] font-medium text-ink-2 shadow-soft transition-colors hover:text-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1120px] px-3 py-6 sm:px-5"><div className="rounded-[var(--radius-shell)] bg-raised p-6 shadow-soft sm:p-9">
        <PageHeader
          eyebrow={taxpayer ? `${humanise(taxpayer.category)} · ${taxpayer.lgaName}` : 'Taxpayer'}
          title={taxpayer ? taxpayerName(taxpayer) : user.fullName}
          description="Everything billed to you, what you have settled, and what remains outstanding."
          actions={
            user.permissions.includes('tcc.apply') ? (
              <Link
                href="/eservices"
                className="rounded-full bg-raised px-4 py-2 text-[13.5px] font-medium text-ink-2 shadow-soft transition-colors hover:text-ink"
              >
                Apply for clearance
              </Link>
            ) : null
          }
        />

        <TileRow cols={4}>
          <StatTile
            label="Outstanding"
            value={money(outstanding)}
            sub={overdue.length ? `${number(overdue.length)} bills overdue` : 'Nothing overdue'}
            tone={outstanding ? 'danger' : 'default'}
          />
          <StatTile label="Settled to date" value={money(paid)} tone="accent" />
          <StatTile label="Bills received" value={number(invoices.length)} />
          <StatTile
            label="Tax identification number"
            value={taxpayer?.tin ?? '—'}
            sub={taxpayer ? humanise(taxpayer.tinStatus) : undefined}
          />
        </TileRow>

        {outstanding > 0 ? (
          <Card className="mt-6 bg-danger-bg">
            <h2 className="text-[16px]">You have {money(outstanding)} outstanding</h2>
            <p className="mt-1.5 max-w-[68ch] text-[13.5px] leading-relaxed text-ink-2">
              Each bill can be settled with its invoice number, online or at a bank branch. A receipt is
              issued the moment the payment posts.
            </p>
            <Link
              href="/pay"
              className="mt-3 inline-block rounded-full bg-[var(--tenant-accent)] px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-[var(--tenant-accent-dark)]"
            >
              Pay a bill
            </Link>
          </Card>
        ) : null}

        <Section title="Your bills" hint={`${number(invoices.length)} in total`}>
          {!user.permissions.includes('invoice.view.own') ? (
            <EmptyState
              title="Your account cannot read bills."
              hint="Ask the Service to grant “View own bills” against your account."
            />
          ) : invoices.length === 0 ? (
            <EmptyState title="No bill has been raised against your record." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>What it covers</Th>
                  <Th align="right">Amount</Th>
                  <Th align="right">Paid</Th>
                  <Th>Status</Th>
                  <Th align="right">Due</Th>
                  <Th align="right" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const due = dueLabel(inv.dueDate);
                  const chasing = inv.status === 'UNPAID' || inv.status === 'PART_PAID';
                  return (
                    <Tr key={inv.id}>
                      <Td mono>
                        <Link href={`/pay?invoice=${inv.invoiceNumber}`} className="hover:text-[var(--tenant-accent)]">
                          {inv.invoiceNumber}
                        </Link>
                      </Td>
                      <Td>
                        <span className="text-[12.5px] text-ink-2">{inv.description}</span>
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
                      </Td>
                      <Td align="right">
                        <Link
                          href={`/print/invoice/${inv.invoiceNumber}`}
                          className="rounded-full bg-sunk px-3 py-1.5 text-[12.5px] font-medium text-ink-2 hover:text-ink"
                        >
                          Print
                        </Link>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Section>
        </div>
      </div>
    </div>
  );
}
