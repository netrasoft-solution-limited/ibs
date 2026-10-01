import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getInvoiceByNumber, getTaxpayer, getTenant } from '@/lib/api';
import { date, dueLabel, humanise, money, taxpayerName } from '@/lib/format';
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
  return { title: `Invoice ${decodeURIComponent(number)}` };
}

export default async function InvoiceDocument({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const invoice = await getInvoiceByNumber(decodeURIComponent(number));
  if (!invoice) notFound();

  const [tenant, taxpayer] = await Promise.all([getTenant(), getTaxpayer(invoice.taxpayerId)]);

  const balance = invoice.totalAmount - invoice.amountPaid;
  const due = dueLabel(invoice.dueDate);
  const settled = balance <= 0;

  return (
    <>
      <div className="no-print mx-auto mt-4 flex max-w-[820px] justify-end gap-2 px-6">
        <PrintButton label="Print invoice" />
      </div>

      <Sheet>
        <DocumentHead
          tenant={tenant}
          title="Tax invoice"
          referenceLabel="Invoice number"
          reference={invoice.invoiceNumber}
          issuedAt={invoice.createdAt}
        />

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <PartyBlock
            label="Billed to"
            name={taxpayer ? taxpayerName(taxpayer) : (invoice.taxpayerName ?? '—')}
            lines={[
              `TIN ${invoice.taxpayerTin}`,
              taxpayer?.address,
              taxpayer?.lgaName ? `${taxpayer.lgaName} Local Government Area` : undefined,
              taxpayer?.phone,
            ]}
          />
          <div className="sm:text-right">
            <p className="eyebrow">Bill type</p>
            <p className="mt-1.5 text-[14px] font-semibold">{humanise(invoice.type)}</p>
            <p className="mt-3 text-[12.5px] text-ink-2">
              Issued {date(invoice.createdAt)}
            </p>
            <p className={`text-[12.5px] ${!settled && due.overdue ? 'font-medium text-danger' : 'text-ink-2'}`}>
              Due {date(invoice.dueDate)}
              {!settled ? ` — ${due.text}` : ''}
            </p>
          </div>
        </div>

        {/* What is being charged, head by head. A bill a taxpayer cannot read
            line by line is a bill they will dispute at the counter. */}
        <table className="mt-7 w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="border-b border-rule-2 pb-2 text-left text-[11.5px] font-medium text-ink-3">
                Revenue head
              </th>
              <th className="border-b border-rule-2 pb-2 text-right text-[11.5px] font-medium text-ink-3">
                Qty
              </th>
              <th className="border-b border-rule-2 pb-2 text-right text-[11.5px] font-medium text-ink-3">
                Unit
              </th>
              <th className="border-b border-rule-2 pb-2 text-right text-[11.5px] font-medium text-ink-3">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((l) => (
              <tr key={l.id}>
                <td className="border-b border-rule py-2.5">
                  {l.description}
                  <span className="block text-[11.5px] text-ink-3">Due {date(l.dueDate)}</span>
                </td>
                <td className="tabular border-b border-rule py-2.5 text-right">{l.quantity}</td>
                <td className="tabular border-b border-rule py-2.5 text-right text-ink-3">
                  {money(l.unitAmount)}
                </td>
                <td className="tabular border-b border-rule py-2.5 text-right">{money(l.lineTotal)}</td>
              </tr>
            ))}

            <tr>
              <td colSpan={3} className="pt-3 text-right text-[13.5px]">
                Total billed
              </td>
              <td className="tabular pt-3 text-right text-[14px] font-medium">{money(invoice.totalAmount)}</td>
            </tr>
            {invoice.amountPaid > 0 ? (
              <tr>
                <td colSpan={3} className="py-1 text-right text-[13.5px] text-ink-2">
                  Less settled
                </td>
                <td className="tabular py-1 text-right text-[13.5px] text-ink-2">
                  −{money(invoice.amountPaid)}
                </td>
              </tr>
            ) : null}
            <tr>
              <td colSpan={3} className="border-t border-ink pt-3 text-right text-[15px] font-semibold">
                Amount payable
              </td>
              <td className="tabular border-t border-ink pt-3 text-right text-[19px] font-semibold">
                {money(balance)}
              </td>
            </tr>
          </tbody>
        </table>

        {settled ? (
          <div className="print-exact avoid-break mt-7 rounded-[var(--radius-inner)] border border-ok/30 bg-ok-bg p-5">
            <p className="text-[14px] font-semibold text-ok">Settled in full</p>
            <p className="mt-1 text-[12.5px] text-ink-2">
              Nothing further is payable on this bill. A receipt has been issued against it.
            </p>
          </div>
        ) : (
          <div className="avoid-break mt-7 rounded-[var(--radius-inner)] border border-rule-2 p-5">
            <p className="text-[13px] font-semibold">How to pay</p>
            <ol className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-ink-2">
              <li>
                <span className="font-medium">Online</span> — go to {tenant.theme.portalUrl}/pay and enter
                invoice number <span className="tabular font-medium">{invoice.invoiceNumber}</span>. Pay by
                card or transfer.
              </li>
              <li>
                <span className="font-medium">At a bank</span> — present this printed invoice at any
                collecting bank branch and quote the invoice number.
              </li>
            </ol>
            <p className="mt-3 text-[12px] text-ink-3">
              Settlement posts against this bill automatically and a receipt is issued the same moment.
              Quote the invoice number on every payment — a payment without it cannot be matched.
            </p>
          </div>
        )}

        <VerificationBlock
          tenant={tenant}
          reference={invoice.invoiceNumber}
          note="Anyone asked to accept this invoice can confirm it is genuine, and see what remains payable, without an account."
        />

        <DocumentFooter
          tenant={tenant}
          note="This invoice is issued under the revenue laws of the State. It is valid without a signature: its authority rests on the record held by the Service, which the reference above checks against."
        />
      </Sheet>
    </>
  );
}
