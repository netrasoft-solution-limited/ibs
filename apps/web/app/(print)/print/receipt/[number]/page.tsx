import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getInvoiceByNumber, getPaymentByReceipt, getTaxpayer, getTenant } from '@/lib/api';
import { date, dateTime, humanise, money, taxpayerName } from '@/lib/format';
import {
  DocumentFooter,
  DocumentHead,
  PartyBlock,
  Sheet,
  VerificationBlock,
} from '@/components/document';
import { PrintButton } from '@/components/print-button';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  return { title: `Receipt ${decodeURIComponent(number)}` };
}

export default async function ReceiptDocument({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const payment = await getPaymentByReceipt(decodeURIComponent(number));
  if (!payment || payment.status !== 'SUCCESSFUL') notFound();

  const tenant = await getTenant();
  const invoice = payment.invoiceNumber ? await getInvoiceByNumber(payment.invoiceNumber) : null;
  const taxpayer = invoice ? await getTaxpayer(invoice.taxpayerId) : null;

  const balance = invoice ? invoice.totalAmount - invoice.amountPaid : 0;

  return (
    <>
      <div className="no-print mx-auto mt-4 flex max-w-[820px] justify-end gap-2 px-6">
        <PrintButton label="Print receipt" />
      </div>

      <Sheet>
        <DocumentHead
          tenant={tenant}
          title="Official receipt"
          referenceLabel="Receipt number"
          reference={payment.receiptNumber ?? payment.reference}
          issuedAt={payment.paidAt ?? payment.createdAt}
        />

        {/* The figure is the point of a receipt, so it leads. */}
        <div className="print-exact avoid-break mt-6 rounded-[var(--radius-inner)] border border-ok/30 bg-ok-bg p-6">
          <p className="eyebrow">Received with thanks</p>
          <p className="tabular mt-1.5 text-[34px] leading-none font-semibold text-ok">
            {money(payment.amount)}
          </p>
          <p className="mt-2 text-[12.5px] text-ink-2">
            {humanise(payment.channel)} · settled {dateTime(payment.paidAt ?? payment.createdAt)}
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <PartyBlock
            label="Received from"
            name={taxpayer ? taxpayerName(taxpayer) : (payment.taxpayerName ?? '—')}
            lines={[
              taxpayer ? `TIN ${taxpayer.tin}` : undefined,
              taxpayer?.address,
              taxpayer?.lgaName ? `${taxpayer.lgaName} Local Government Area` : undefined,
            ]}
          />
          <div className="sm:text-right">
            <p className="eyebrow">Settles invoice</p>
            <p className="tabular mt-1.5 text-[14px] font-semibold">{payment.invoiceNumber ?? '—'}</p>
            {invoice ? (
              <p className="mt-1 text-[12.5px] text-ink-2">
                {humanise(invoice.type)} · billed {money(invoice.totalAmount)}
              </p>
            ) : null}
            <p className="mt-3 eyebrow">Gateway reference</p>
            <p className="tabular text-[12.5px]">{payment.reference}</p>
          </div>
        </div>

        {invoice ? (
          <table className="mt-7 w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="border-b border-rule-2 pb-2 text-left text-[11.5px] font-medium text-ink-3">
                  What this payment settles
                </th>
                <th className="border-b border-rule-2 pb-2 text-right text-[11.5px] font-medium text-ink-3">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((l) => (
                <tr key={l.id}>
                  <td className="border-b border-rule py-2.5">{l.description}</td>
                  <td className="tabular border-b border-rule py-2.5 text-right">{money(l.lineTotal)}</td>
                </tr>
              ))}
              <tr>
                <td className="pt-3 text-right text-[13.5px] text-ink-2">Total billed</td>
                <td className="tabular pt-3 text-right text-[13.5px] text-ink-2">
                  {money(invoice.totalAmount)}
                </td>
              </tr>
              <tr>
                <td className="py-1 text-right text-[13.5px]">Settled to date</td>
                <td className="tabular py-1 text-right text-[13.5px]">{money(invoice.amountPaid)}</td>
              </tr>
              <tr>
                <td className="border-t border-ink pt-3 text-right text-[15px] font-semibold">
                  Balance remaining
                </td>
                <td
                  className={`tabular border-t border-ink pt-3 text-right text-[19px] font-semibold ${
                    balance > 0 ? 'text-danger' : ''
                  }`}
                >
                  {money(balance)}
                </td>
              </tr>
            </tbody>
          </table>
        ) : null}

        {balance > 0 ? (
          <div className="avoid-break mt-6 rounded-[var(--radius-inner)] border border-rule-2 p-5">
            <p className="text-[13px] font-semibold">This is a part payment</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
              {money(balance)} remains payable on invoice{' '}
              <span className="tabular">{payment.invoiceNumber}</span>. This receipt evidences the amount
              received above, and nothing more.
            </p>
          </div>
        ) : null}

        <VerificationBlock
          tenant={tenant}
          reference={payment.receiptNumber ?? payment.reference}
          note="Anyone asked to accept this receipt as proof of payment can confirm it against the Service's own record, without an account."
        />

        <DocumentFooter
          tenant={tenant}
          note="This receipt evidences payment received by the Service against the invoice named above. It is issued electronically and is valid without a signature. A duplicate receipt cannot be issued for the same gateway reference."
        />
      </Sheet>
    </>
  );
}
