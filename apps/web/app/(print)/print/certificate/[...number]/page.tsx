import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getTaxpayer, getTccByCertificateNumber, getTenant } from '@/lib/api';
import { date, humanise, money, taxpayerName } from '@/lib/format';
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
  return { title: `Clearance certificate ${number.map(decodeURIComponent).join('/')}` };
}

export default async function CertificateDocument({
  params,
}: {
  params: Promise<{ number: string[] }>;
}) {
  const { number } = await params;
  const app = await getTccByCertificateNumber(number.map(decodeURIComponent).join('/'));

  // Only an issued certificate is a certificate. An application still in the
  // chain, or declined, has nothing to print — printing one would hand the
  // applicant a document the Service never granted.
  if (!app || app.stage !== 'ISSUED') notFound();

  const [tenant, taxpayer] = await Promise.all([getTenant(), getTaxpayer(app.taxpayerId)]);
  const expired = app.expiresAt ? new Date(app.expiresAt) < new Date() : false;
  const director = [...app.history].reverse().find((e) => e.stage === 'ISSUED' || e.stage === 'DIRECTOR_REVIEW');

  return (
    <>
      <div className="no-print mx-auto mt-4 flex max-w-[820px] justify-end gap-2 px-6">
        <PrintButton label="Print certificate" />
      </div>

      <Sheet>
        <DocumentHead
          tenant={tenant}
          title="Tax clearance certificate"
          referenceLabel="Certificate number"
          reference={app.certificateNumber}
          issuedAt={app.issuedAt}
        />

        <div className="print-exact avoid-break mt-6 rounded-[var(--radius-inner)] border border-ok/30 bg-ok-bg p-6 text-center">
          <p className="eyebrow">This is to certify that</p>
          <p className="mt-2 text-[26px] leading-tight font-semibold">
            {taxpayer ? taxpayerName(taxpayer) : app.taxpayerName}
          </p>
          <p className="tabular mt-1 text-[13px] text-ink-2">TIN {app.taxpayerTin}</p>
          <p className="mx-auto mt-4 max-w-[62ch] text-[13.5px] leading-relaxed text-ink-2">
            has settled all taxes assessed and due to the {tenant.name} for the{' '}
            <span className="font-medium">{app.yearOfAssessment}</span> year of assessment, and that no
            liability stood outstanding against the taxpayer at the date of issue.
          </p>
        </div>

        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <PartyBlock
            label="Issued to"
            name={taxpayer ? taxpayerName(taxpayer) : app.taxpayerName}
            lines={[
              `TIN ${app.taxpayerTin}`,
              taxpayer ? humanise(taxpayer.category) : undefined,
              taxpayer?.address,
              taxpayer?.lgaName ? `${taxpayer.lgaName} Local Government Area` : undefined,
            ]}
          />
          <div className="sm:text-right">
            <p className="eyebrow">Year of assessment</p>
            <p className="tabular mt-1.5 text-[14px] font-semibold">{app.yearOfAssessment}</p>
            <p className="eyebrow mt-3">Issued</p>
            <p className="text-[13px]">{date(app.issuedAt)}</p>
            <p className="eyebrow mt-3">Valid until</p>
            <p className={`text-[13px] font-medium ${expired ? 'text-danger' : ''}`}>
              {date(app.expiresAt)}
              {expired ? ' — expired' : ''}
            </p>
          </div>
        </div>

        {/* The chain is on the certificate: who reviewed it, and when. A
            certificate that cannot say who issued it is one the Service
            cannot defend. */}
        <div className="avoid-break mt-7">
          <p className="eyebrow">Reviewed and issued by</p>
          <table className="mt-2 w-full border-collapse text-[12.5px]">
            <tbody>
              {app.history.map((e, i) => (
                <tr key={`${e.stage}-${i}`}>
                  <td className="border-b border-rule py-2">{humanise(e.stage)}</td>
                  <td className="border-b border-rule py-2">{e.actorName}</td>
                  <td className="tabular border-b border-rule py-2 text-right text-ink-3">
                    {date(e.actedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="avoid-break mt-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="border-t border-ink pt-2 text-[12.5px]">{director?.actorName ?? '—'}</p>
            <p className="text-[11.5px] text-ink-3">Director, for the {tenant.shortName}</p>
          </div>
          {expired ? (
            <p className="print-exact rounded-full bg-danger-bg px-4 py-2 text-[12.5px] font-medium text-danger">
              Expired {date(app.expiresAt)}
            </p>
          ) : (
            <p className="print-exact rounded-full bg-ok-bg px-4 py-2 text-[12.5px] font-medium text-ok">
              Valid to {date(app.expiresAt)}
            </p>
          )}
        </div>

        <VerificationBlock
          tenant={tenant}
          reference={app.certificateNumber}
          note="Any party asked to accept this certificate — a bank, a ministry, a procurement office — can confirm it against the Service's own record before relying on it."
        />

        <DocumentFooter
          tenant={tenant}
          note="Issued electronically under the revenue laws of the State and valid without a wet signature. This certificate speaks only to the year of assessment named above, and only to liabilities known to the Service at the date of issue."
        />
      </Sheet>
    </>
  );
}
