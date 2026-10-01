import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getInvoice, getPayment } from '@/lib/api';
import { dateTime, humanise, money } from '@/lib/format';
import { Button, Card, DefList, LinkButton, PageHeader, StatusBadge } from '@/components/ui';
import { requirePermission } from '@/lib/session';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const payment = await getPayment(id);
  return { title: payment ? payment.reference : 'Payment' };
}

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('payment.view');
  const { id } = await params;
  const payment = await getPayment(id);
  if (!payment) notFound();

  const invoice = await getInvoice(payment.invoiceId);

  return (
    <>
      <PageHeader
        eyebrow={`${humanise(payment.channel)} · ${humanise(payment.status)}`}
        title={payment.receiptNumber ?? payment.reference}
        description={
          payment.status === 'SUCCESSFUL'
            ? 'This settlement posted against the bill and a receipt was issued the same moment.'
            : 'This attempt did not settle. The gateway message is retained for reconciliation and dispute.'
        }
        actions={
          <>
            {payment.receiptNumber && payment.status === 'SUCCESSFUL' ? (
              <LinkButton href={`/print/receipt/${payment.receiptNumber}`} variant="primary">
                Print receipt
              </LinkButton>
            ) : null}
            {user.permissions.includes('payment.reverse') && payment.status === 'SUCCESSFUL' ? (
              <Button>Reverse posting</Button>
            ) : null}
          </>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div>
            <h2 className="text-[16px] font-semibold">Settlement</h2>
          </div>
          <Card className="mt-4">
            <DefList
              rows={[
                ['Status', <StatusBadge key="s" status={payment.status} />],
                ['Amount', <span key="a" className="tabular">{money(payment.amount)}</span>],
                ['Channel', humanise(payment.channel)],
                ['Gateway reference', <span key="r" className="tabular">{payment.reference}</span>],
                ['Receipt number', <span key="rc" className="tabular">{payment.receiptNumber ?? '—'}</span>],
                ['Settled at', dateTime(payment.paidAt)],
                ['Recorded at', dateTime(payment.createdAt)],
              ]}
            />
          </Card>

          <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
            The gateway reference is unique per tenant at the database level. A second posting carrying the
            same reference is refused rather than duplicated.
          </p>
        </div>

        <div>
          <div>
            <h2 className="text-[16px] font-semibold">Bill settled</h2>
          </div>
          <Card className="mt-4">
            {invoice ? (
              <DefList
                rows={[
                  [
                    'Invoice',
                    <Link key="i" href={`/invoices/${invoice.id}`} className="tabular text-[var(--tenant-accent)]">
                      {invoice.invoiceNumber}
                    </Link>,
                  ],
                  ['Bill type', humanise(invoice.type)],
                  ['Bill status', <StatusBadge key="s" status={invoice.status} />],
                  ['Total billed', <span key="t" className="tabular">{money(invoice.totalAmount)}</span>],
                  ['Total settled', <span key="p" className="tabular">{money(invoice.amountPaid)}</span>],
                  [
                    'Balance',
                    <span key="b" className="tabular">
                      {money(invoice.totalAmount - invoice.amountPaid)}
                    </span>,
                  ],
                  [
                    'Taxpayer',
                    <Link key="tp" href={`/taxpayers/${invoice.taxpayerId}`} className="text-[var(--tenant-accent)]">
                      {invoice.taxpayerName}
                    </Link>,
                  ],
                ]}
              />
            ) : (
              <p className="text-[13px] text-ink-3">The bill this payment refers to could not be found.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
