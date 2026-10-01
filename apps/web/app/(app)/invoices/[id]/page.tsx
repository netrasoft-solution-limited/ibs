import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getInvoice, getTaxpayer, listPaymentsForInvoice } from '@/lib/api';
import { date, dateTime, dueLabel, humanise, money, number } from '@/lib/format';
import {
  Button,
  Card,
  DefList,
  EmptyState,
  LinkButton,
  PageHeader,
  Section,
  StatusBadge,
  Table,
  Td,
  Th,
  Tr,
} from '@/components/ui';
import { requirePermission } from '@/lib/session';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const invoice = await getInvoice(id);
  return { title: invoice ? invoice.invoiceNumber : 'Invoice' };
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('invoice.view');
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const [taxpayer, payments] = await Promise.all([
    getTaxpayer(invoice.taxpayerId),
    listPaymentsForInvoice(invoice.id),
  ]);

  const balance = invoice.totalAmount - invoice.amountPaid;
  const due = dueLabel(invoice.dueDate);
  const chasing = invoice.status === 'UNPAID' || invoice.status === 'PART_PAID';

  return (
    <>
      <PageHeader
        eyebrow={`${humanise(invoice.type)} · raised ${date(invoice.createdAt)}`}
        title={invoice.invoiceNumber}
        description={invoice.description}
        actions={
          <>
            <LinkButton href={`/print/invoice/${invoice.invoiceNumber}`}>Print invoice</LinkButton>
            <LinkButton href={`/taxpayers/${invoice.taxpayerId}`}>Taxpayer record</LinkButton>
            {user.permissions.includes('invoice.cancel') && chasing ? (
              <Button>Cancel bill</Button>
            ) : null}
            {chasing ? (
              <LinkButton href={`/payments?q=${invoice.invoiceNumber}`} variant="primary">
                Record payment
              </LinkButton>
            ) : null}
          </>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-[16px] font-semibold">Revenue heads on this bill</h2>
            <span className="eyebrow">{number(invoice.lines.length)} lines</span>
          </div>

          <Table>
            <thead>
              <tr>
                <Th>Revenue head</Th>
                <Th align="right">Qty</Th>
                <Th align="right">Unit</Th>
                <Th align="right">Line total</Th>
                <Th align="right">Due</Th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <Tr key={line.id}>
                  <Td>{line.description}</Td>
                  <Td align="right" mono>
                    {line.quantity}
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {money(line.unitAmount)}
                  </Td>
                  <Td align="right" mono>
                    {money(line.lineTotal)}
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {date(line.dueDate)}
                  </Td>
                </Tr>
              ))}
              <tr>
                <td colSpan={3} className="border-t border-rule-2 pt-3 text-right text-[14px] font-medium">
                  Total
                </td>
                <td className="tabular border-t border-rule-2 pr-3 pt-3 text-right text-[16px] font-medium">
                  {money(invoice.totalAmount)}
                </td>
                <td className="border-t border-rule-2" />
              </tr>
            </tbody>
          </Table>

          <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
            Where the heads on a bill carry different billing frequencies, the earliest due date governs the
            whole bill. That rule lives in <span className="font-mono">@igr/tax-rules</span>, not in this screen.
          </p>
        </div>

        <div>
          <div>
            <h2 className="text-[16px] font-semibold">Settlement</h2>
          </div>
          <Card className="mt-4">
            <DefList
              rows={[
                ['Status', <StatusBadge key="s" status={invoice.status} />],
                ['Total billed', <span key="t" className="tabular">{money(invoice.totalAmount)}</span>],
                ['Amount paid', <span key="p" className="tabular">{money(invoice.amountPaid)}</span>],
                [
                  'Balance',
                  <span key="b" className={`tabular ${balance > 0 ? 'text-danger' : 'text-ink-3'}`}>
                    {money(balance)}
                  </span>,
                ],
                [
                  'Due date',
                  <span key="d" className={chasing && due.overdue ? 'text-danger' : ''}>
                    {date(invoice.dueDate)}
                    {chasing ? <span className="block text-[11.5px]">{due.text}</span> : null}
                  </span>,
                ],
              ]}
            />
          </Card>

          <div className="mt-6">
            <h2 className="text-[16px] font-semibold">Taxpayer</h2>
          </div>
          <Card className="mt-4">
            <DefList
              rows={[
                [
                  'Name',
                  <Link key="n" href={`/taxpayers/${invoice.taxpayerId}`} className="text-[var(--tenant-accent)]">
                    {invoice.taxpayerName}
                  </Link>,
                ],
                ['TIN', <span key="t" className="tabular">{invoice.taxpayerTin}</span>],
                ['Area', taxpayer?.lgaName ?? '—'],
                ['Email', taxpayer?.email ?? '—'],
                ['Phone', <span key="p" className="tabular">{taxpayer?.phone ?? '—'}</span>],
              ]}
            />
          </Card>
        </div>
      </div>

      <Section title="Payments posted against this bill" hint={`${number(payments.length)} records`}>
        {payments.length === 0 ? (
          <EmptyState
            title="Nothing has been posted against this bill."
            hint="A payment appears here the moment the gateway confirms it, or an officer records an in-branch settlement."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Reference</Th>
                <Th>Receipt</Th>
                <Th>Channel</Th>
                <Th>Status</Th>
                <Th align="right">Amount</Th>
                <Th align="right">Posted</Th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <Tr key={p.id}>
                  <Td mono>
                    <Link href={`/payments/${p.id}`} className="hover:text-[var(--tenant-accent)]">
                      {p.reference}
                    </Link>
                  </Td>
                  <Td mono className="text-ink-3">
                    {p.receiptNumber ?? '—'}
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
        )}
      </Section>
    </>
  );
}
