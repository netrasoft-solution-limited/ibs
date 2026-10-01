import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getTaxpayer, listInvoicesForTaxpayer } from '@/lib/api';
import { date, dueLabel, humanise, money, number, taxpayerName } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  DefList,
  EmptyState,
  LinkButton,
  PageHeader,
  Section,
  StatTile,
  StatusBadge,
  Table,
  Td,
  Th,
  TileRow,
  Tr,
} from '@/components/ui';
import { requirePermission } from '@/lib/session';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const taxpayer = await getTaxpayer(id);
  return { title: taxpayer ? taxpayerName(taxpayer) : 'Taxpayer' };
}

export default async function TaxpayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('taxpayer.view');
  const { id } = await params;
  const taxpayer = await getTaxpayer(id);
  if (!taxpayer) notFound();

  const invoices = await listInvoicesForTaxpayer(taxpayer.id);
  const billed = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const paid = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const overdue = invoices.filter(
    (i) => (i.status === 'UNPAID' || i.status === 'PART_PAID') && new Date(i.dueDate) < new Date(),
  );

  return (
    <>
      <PageHeader
        eyebrow={humanise(taxpayer.category)}
        title={taxpayerName(taxpayer)}
        description={taxpayer.address}
        actions={
          <>
            {user.permissions.includes('taxpayer.update') ? <Button>Amend record</Button> : null}
            {user.permissions.includes('taxpayer.deactivate') && taxpayer.isActive ? (
              <Button>Deactivate</Button>
            ) : null}
            <LinkButton href={`/invoices?taxpayerId=${taxpayer.id}`}>All bills</LinkButton>
            <LinkButton href={`/invoices/new?taxpayerId=${taxpayer.id}`} variant="primary">
              Raise invoice
            </LinkButton>
          </>
        }
      />

      <TileRow cols={4}>
        <StatTile label="Total billed" value={money(billed)} sub={`${number(invoices.length)} bills raised`} />
        <StatTile label="Settled" value={money(paid)} sub="Posted against bills" tone="accent" />
        <StatTile
          label="Outstanding"
          value={money(taxpayer.outstandingAmount)}
          sub={overdue.length ? `${number(overdue.length)} bills overdue` : 'Nothing overdue'}
          tone={taxpayer.outstandingAmount ? 'danger' : 'default'}
        />
        <StatTile
          label="Compliance"
          value={
            invoices.length ? `${Math.round((invoices.filter((i) => i.status === 'PAID').length / invoices.length) * 100)}%` : '—'
          }
          sub="Bills settled in full"
        />
      </TileRow>

      <div className="mt-9 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <div>
            <h2 className="text-[16px] font-semibold">Record</h2>
          </div>
          <Card className="mt-4">
            <DefList
              rows={[
                ['Tax identification number', <span key="tin" className="tabular">{taxpayer.tin}</span>],
                ['TIN status', <StatusBadge key="s" status={taxpayer.tinStatus} />],
                ['Category', humanise(taxpayer.category)],
                ['Local government area', taxpayer.lgaName ?? '—'],
                ['Email', taxpayer.email],
                ['Phone', <span key="p" className="tabular">{taxpayer.phone}</span>],
                ['Address', taxpayer.address ?? '—'],
                ['Registered', date(taxpayer.createdAt)],
                [
                  'Account',
                  taxpayer.isActive ? <Badge key="a" tone="ok">Active</Badge> : <Badge key="a" tone="neutral">Inactive</Badge>,
                ],
              ]}
            />
          </Card>

          <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
            The TIN encodes the year of issue and the two-digit code of the local government area, so the
            area a taxpayer belongs to is readable from the identifier itself.
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-[16px] font-semibold">Billing history</h2>
            <span className="eyebrow">{number(invoices.length)} bills</span>
          </div>

          {invoices.length === 0 ? (
            <EmptyState title="No bills have been raised against this taxpayer." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>Type</Th>
                  <Th align="right">Amount</Th>
                  <Th align="right">Paid</Th>
                  <Th>Status</Th>
                  <Th align="right">Due</Th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 25).map((inv) => {
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
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}

          {invoices.length > 25 ? (
            <p className="mt-3 text-[12.5px] text-ink-3">
              Showing the 25 most recent.{' '}
              <Link href={`/invoices?taxpayerId=${taxpayer.id}`} className="text-[var(--tenant-accent)]">
                See all {number(invoices.length)} bills →
              </Link>
            </p>
          ) : null}
        </div>
      </div>

      {overdue.length > 0 ? (
        <Section title="Overdue" hint="Eligible for a demand notice">
          <Card className="mt-4 bg-danger-bg">
            <p className="text-[13.5px] text-ink-2">
              {number(overdue.length)} bills totalling{' '}
              <span className="tabular text-danger">
                {money(overdue.reduce((s, i) => s + (i.totalAmount - i.amountPaid), 0))}
              </span>{' '}
              are past their due date. A demand notice may be issued against the outstanding liability.
            </p>
            <div className="mt-3">
              <LinkButton href={`/invoices?taxpayerId=${taxpayer.id}&status=UNPAID`} size="sm">
                Review the outstanding bills
              </LinkButton>
            </div>
          </Card>
        </Section>
      ) : null}
    </>
  );
}
