import type { Metadata } from 'next';

import { getInvoiceByNumber, getPaymentByReceipt } from '@/lib/api';
import { dateTime, humanise, money } from '@/lib/format';
import { Card, Field, Input, StatusBadge } from '@/components/ui';

export const metadata: Metadata = { title: 'Verify a receipt' };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const query = sp.ref?.trim();

  // One box accepts either kind of number — the person holding a piece of
  // paper should not have to know which sort of number is on it.
  const [payment, invoice] = query
    ? await Promise.all([getPaymentByReceipt(query), getInvoiceByNumber(query)])
    : [null, null];

  const found = payment ?? invoice;

  return (
    <>
      <div>
        <p className="eyebrow">Verification</p>
        <h1 className="mt-2 text-[30px] font-semibold leading-tight">Verify an invoice or receipt</h1>
        <p className="mt-2 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-2">
          Anyone can confirm that a bill or a receipt issued by the Service is genuine. Enter either number.
        </p>
      </div>

      <form method="get" className="mt-5 flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] bg-sunk p-5">
        <div className="min-w-[280px] flex-1">
          <Field label="Receipt or invoice number">
            <Input name="ref" defaultValue={query ?? ''} placeholder="RCT500044 or NAS00400000" autoFocus />
          </Field>
        </div>
        <button
          type="submit"
          className="rounded-full bg-deep px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-ink"
        >
          Verify
        </button>
      </form>

      {query && !found ? (
        <Card className="mt-6 bg-danger-bg">
          <h2 className="text-[16px] text-danger">Not recognised</h2>
          <p className="mt-1.5 max-w-[62ch] text-[13.5px] leading-relaxed text-ink-2">
            No invoice or receipt carries that number. A document quoting it was not issued by this
            Service.
          </p>
        </Card>
      ) : null}

      {payment ? (
        <Card className="mt-6 bg-ok-bg">
          <p className="eyebrow">Genuine receipt</p>
          <h2 className="mt-1.5 text-[20px]">{money(payment.amount)} received</h2>
          <dl className="mt-4 max-w-[520px]">
            {(
              [
                ['Receipt number', payment.receiptNumber ?? '—'],
                ['Settles invoice', payment.invoiceNumber ?? '—'],
                ['Paid by', payment.taxpayerName ?? '—'],
                ['Channel', humanise(payment.channel)],
                ['Received', dateTime(payment.paidAt ?? payment.createdAt)],
              ] as const
            ).map(([term, value]) => (
              <div key={term} className="flex justify-between gap-6 border-b border-rule py-2 last:border-b-0">
                <dt className="text-[13px] text-ink-3">{term}</dt>
                <dd className="text-right text-[13.5px]">{value}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-6 border-t border-rule py-2">
              <dt className="text-[13px] text-ink-3">Status</dt>
              <dd>
                <StatusBadge status={payment.status} />
              </dd>
            </div>
          </dl>

          {payment.receiptNumber ? (
            <a
              href={`/print/receipt/${payment.receiptNumber}`}
              className="mt-4 inline-block rounded-full bg-deep px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-ink"
            >
              Print receipt
            </a>
          ) : null}
        </Card>
      ) : null}

      {!payment && invoice ? (
        <Card className="mt-6 bg-accent-soft">
          <p className="eyebrow">Genuine invoice</p>
          <h2 className="mt-1.5 text-[20px]">{money(invoice.totalAmount)} billed</h2>
          <dl className="mt-4 max-w-[520px]">
            {(
              [
                ['Invoice number', invoice.invoiceNumber],
                ['Billed to', invoice.taxpayerName ?? '—'],
                ['Bill type', humanise(invoice.type)],
                ['Amount paid', money(invoice.amountPaid)],
                ['Balance', money(invoice.totalAmount - invoice.amountPaid)],
              ] as const
            ).map(([term, value]) => (
              <div key={term} className="flex justify-between gap-6 border-b border-rule py-2">
                <dt className="text-[13px] text-ink-3">{term}</dt>
                <dd className="text-right text-[13.5px]">{value}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-6 py-2">
              <dt className="text-[13px] text-ink-3">Status</dt>
              <dd>
                <StatusBadge status={invoice.status} />
              </dd>
            </div>
          </dl>
        </Card>
      ) : null}
    </>
  );
}
