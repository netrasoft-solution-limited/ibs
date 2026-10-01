import type { Metadata } from 'next';

import { getInvoiceByNumber } from '@/lib/api';
import { date, dueLabel, humanise, money } from '@/lib/format';
import { Card, Field, Input, StatusBadge, Table, Td, Th, Tr } from '@/components/ui';

export const metadata: Metadata = { title: 'Pay a bill' };

export default async function PayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const query = sp.invoice?.trim();
  const invoice = query ? await getInvoiceByNumber(query) : null;
  const balance = invoice ? invoice.totalAmount - invoice.amountPaid : 0;

  return (
    <>
      <div>
        <p className="eyebrow">Collection</p>
        <h1 className="mt-2 text-[30px] font-semibold leading-tight">Pay a bill by its number</h1>
        <p className="mt-2 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-2">
          Enter the number printed on your invoice or demand notice. No account is required.
        </p>
      </div>

      <form method="get" className="mt-5 flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] bg-sunk p-5">
        <div className="min-w-[280px] flex-1">
          <Field label="Invoice or demand notice number">
            <Input name="invoice" defaultValue={query ?? ''} placeholder="NAS00400000" autoFocus />
          </Field>
        </div>
        <button
          type="submit"
          className="rounded-full bg-deep px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-ink"
        >
          Look up
        </button>
      </form>

      {query && !invoice ? (
        <Card className="mt-6 bg-danger-bg">
          <h2 className="text-[16px] text-danger">No bill found with that number</h2>
          <p className="mt-1.5 max-w-[62ch] text-[13.5px] leading-relaxed text-ink-2">
            Check the number against your invoice. If it is correct and this message persists, the bill may
            have been cancelled — contact the tax office that issued it.
          </p>
        </Card>
      ) : null}

      {invoice ? (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="flex items-baseline justify-between">
                <h2 className="text-[16px] font-semibold">What this bill covers</h2>
                <span className="eyebrow">{humanise(invoice.type)}</span>
              </div>
              <Table>
                <thead>
                  <tr>
                    <Th>Revenue head</Th>
                    <Th align="right">Qty</Th>
                    <Th align="right">Amount</Th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((l) => (
                    <Tr key={l.id}>
                      <Td>{l.description}</Td>
                      <Td align="right" mono>
                        {l.quantity}
                      </Td>
                      <Td align="right" mono>
                        {money(l.lineTotal)}
                      </Td>
                    </Tr>
                  ))}
                  <tr>
                    <td colSpan={2} className="border-t border-rule-2 pt-3 text-right text-[14px] font-medium">
                      Total
                    </td>
                    <td className="tabular border-t border-rule-2 pt-3 text-right text-[16px] font-medium">
                      {money(invoice.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>

            <div>
              <div className="">
                <h2 className="text-[16px] font-semibold">Amount to pay</h2>
              </div>
              <Card className="mt-4">
                <p className="eyebrow">Balance outstanding</p>
                <p className="tabular mt-2 text-[30px] tracking-[-0.03em] text-[var(--tenant-accent)]">
                  {money(balance)}
                </p>

                <dl className="mt-4">
                  <div className="flex justify-between border-b border-rule py-2">
                    <dt className="text-[13px] text-ink-3">Bill number</dt>
                    <dd className="tabular text-[13px]">{invoice.invoiceNumber}</dd>
                  </div>
                  <div className="flex justify-between border-b border-rule py-2">
                    <dt className="text-[13px] text-ink-3">Billed to</dt>
                    <dd className="text-right text-[13px]">{invoice.taxpayerName}</dd>
                  </div>
                  <div className="flex justify-between border-b border-rule py-2">
                    <dt className="text-[13px] text-ink-3">Status</dt>
                    <dd>
                      <StatusBadge status={invoice.status} />
                    </dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-[13px] text-ink-3">Due</dt>
                    <dd className="text-right text-[13px]">
                      {date(invoice.dueDate)}
                      <span className="block text-[11.5px] text-ink-3">{dueLabel(invoice.dueDate).text}</span>
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`/print/invoice/${invoice.invoiceNumber}`}
                    className="rounded-full bg-deep px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-ink"
                  >
                    Print this invoice
                  </a>
                </div>

                {balance > 0 ? (
                  <div className="mt-4 rounded-[var(--radius-inner)] bg-warn-bg/60 p-4">
                    <p className="eyebrow">Not yet wired</p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">
                      Card and transfer checkout begins once the gateway credentials are onboarded against
                      the Service's own merchant accounts.
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 border-l-2 border-l-ok bg-ok-bg px-3 py-2 text-[13px] text-ok">
                    This bill is settled in full. Nothing further is due.
                  </p>
                )}
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
