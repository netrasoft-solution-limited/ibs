import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getDemandNoticeByNumber, getTaxpayer, getTenant } from '@/lib/api';
import { date, dueLabel, money, number as fmtNumber, taxpayerName } from '@/lib/format';
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
  params: Promise<{ number: string[] }>;
}): Promise<Metadata> {
  const { number } = await params;
  return { title: `Demand notice ${number.map(decodeURIComponent).join('/')}` };
}

export default async function NoticeDocument({ params }: { params: Promise<{ number: string[] }> }) {
  const { number } = await params;
  const notice = await getDemandNoticeByNumber(number.map(decodeURIComponent).join('/'));
  if (!notice) notFound();

  const [tenant, taxpayer] = await Promise.all([getTenant(), getTaxpayer(notice.taxpayerId)]);
  const outstanding = notice.amount - notice.amountSettled;
  const due = dueLabel(notice.dueAt);

  return (
    <>
      <div className="no-print mx-auto mt-4 flex max-w-[820px] justify-end gap-2 px-6">
        <PrintButton label="Print notice" />
      </div>

      <Sheet>
        <DocumentHead
          tenant={tenant}
          title="Demand notice"
          referenceLabel="Notice number"
          reference={notice.noticeNumber}
          issuedAt={notice.issuedAt}
        />

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <PartyBlock
            label="Served on"
            name={taxpayer ? taxpayerName(taxpayer) : notice.taxpayerName}
            lines={[
              `TIN ${notice.taxpayerTin}`,
              taxpayer?.address,
              taxpayer?.lgaName ? `${taxpayer.lgaName} Local Government Area` : undefined,
            ]}
          />
          <div className="sm:text-right">
            <p className="eyebrow">Issued by</p>
            <p className="mt-1.5 text-[14px] font-semibold">{notice.issuedByName}</p>
            <p className="mt-1 text-[12.5px] text-ink-2">for the {tenant.shortName}</p>
            <p className="mt-3 eyebrow">Bills cited</p>
            <p className="tabular text-[13px]">{fmtNumber(notice.invoiceCount)}</p>
          </div>
        </div>

        {/* A notice is a demand, so it states the amount and the deadline
            plainly, and says what follows if neither is met. */}
        <div className="print-exact avoid-break mt-7 rounded-[var(--radius-inner)] border border-danger/30 bg-danger-bg p-6">
          <p className="eyebrow">Amount now due</p>
          <p className="tabular mt-1.5 text-[34px] leading-none font-semibold text-danger">
            {money(outstanding)}
          </p>
          <p className="mt-2 text-[12.5px] text-ink-2">
            Payable on or before {date(notice.dueAt)}
            {due.overdue ? ` — this notice is ${due.text}` : ''}
          </p>
        </div>

        <table className="mt-7 w-full border-collapse text-[13px]">
          <tbody>
            <tr>
              <td className="border-b border-rule py-2.5">Total demanded</td>
              <td className="tabular border-b border-rule py-2.5 text-right">{money(notice.amount)}</td>
            </tr>
            <tr>
              <td className="border-b border-rule py-2.5 text-ink-2">Settled since service</td>
              <td className="tabular border-b border-rule py-2.5 text-right text-ink-2">
                −{money(notice.amountSettled)}
              </td>
            </tr>
            <tr>
              <td className="border-t border-ink pt-3 text-right text-[15px] font-semibold">Balance</td>
              <td className="tabular border-t border-ink pt-3 text-right text-[19px] font-semibold">
                {money(outstanding)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="avoid-break mt-7 rounded-[var(--radius-inner)] border border-rule-2 p-5">
          <p className="text-[13px] font-semibold">Take notice</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">
            The sum above is outstanding against bills already raised in your name. This notice does not
            create a new liability; it demands one already on the record, which you may inspect at{' '}
            {tenant.theme.portalUrl} using any of the invoice numbers it cites.
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">
            If the amount is not settled by the date shown, the Service may proceed to enforcement under
            the revenue laws of the State. If you believe this demand is made in error, contact your area
            tax office before that date, quoting the notice number above.
          </p>
        </div>

        <VerificationBlock
          tenant={tenant}
          reference={notice.noticeNumber}
          note="This notice can be checked against the Service's own record. A demand quoting a reference that does not verify was not issued by this Service."
        />

        <DocumentFooter
          tenant={tenant}
          note="Served under the revenue laws of the State. Retain this notice: it is evidence of the demand and of the date from which the period to settle runs."
        />
      </Sheet>
    </>
  );
}
