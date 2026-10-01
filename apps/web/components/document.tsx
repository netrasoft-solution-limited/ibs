import type { ReactNode } from 'react';

import type { Tenant } from '@/lib/types';
import { dateTime } from '@/lib/format';

/**
 * The shared furniture of a printed document.
 *
 * An invoice, a receipt and a demand notice are the three things this platform
 * puts on paper, and they must be recognisably the same instrument: same
 * masthead, same verification block, same footer. A taxpayer holding two of
 * them should not have to wonder whether both came from the Service.
 */

export function Sheet({ children }: { children: ReactNode }) {
  return (
    <div className="sheet mx-auto my-6 max-w-[820px] rounded-[var(--radius-card)] bg-raised p-10 shadow-soft">
      {children}
    </div>
  );
}

export function DocumentHead({
  tenant,
  title,
  reference,
  referenceLabel,
  issuedAt,
}: {
  tenant: Tenant;
  title: string;
  reference: string;
  referenceLabel: string;
  issuedAt?: string;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-ink pb-5">
      <div className="flex items-start gap-3">
        <span className="print-exact grid h-12 w-12 shrink-0 place-items-center rounded-full bg-deep text-[17px] font-semibold text-white">
          {tenant.theme.crestInitials}
        </span>
        <div>
          <p className="text-[15px] leading-tight font-semibold">{tenant.name}</p>
          <p className="text-[12px] text-ink-3">{tenant.stateName}</p>
          <p className="mt-1 text-[12px] text-ink-3">{tenant.theme.portalUrl}</p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-[19px] font-semibold">{title}</p>
        <p className="eyebrow mt-1">{referenceLabel}</p>
        <p className="tabular text-[15px] font-semibold">{reference}</p>
        {issuedAt ? <p className="mt-1 text-[11.5px] text-ink-3">Issued {dateTime(issuedAt)}</p> : null}
      </div>
    </header>
  );
}

/** Two facing blocks — who issued it, and who it concerns. */
export function PartyBlock({
  label,
  name,
  lines,
}: {
  label: string;
  name: string;
  lines: Array<string | undefined>;
}) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="mt-1.5 text-[14px] font-semibold">{name}</p>
      {lines.filter(Boolean).map((l, i) => (
        <p key={i} className="text-[12.5px] leading-relaxed text-ink-2">
          {l}
        </p>
      ))}
    </div>
  );
}

/**
 * The verification block.
 *
 * A printed document is only worth anything if a third party can check it, so
 * every sheet carries the address and the reference to check it against. The
 * square stands in for the QR code the API will render once it can sign one.
 */
export function VerificationBlock({
  tenant,
  reference,
  note,
}: {
  tenant: Tenant;
  reference: string;
  note: string;
}) {
  return (
    <div className="avoid-break mt-8 flex flex-wrap items-center gap-5 rounded-[var(--radius-inner)] bg-sunk p-5">
      <div className="print-exact grid h-[86px] w-[86px] shrink-0 place-items-center rounded-[10px] border border-rule-2 bg-raised">
        <span className="text-center text-[9px] leading-tight text-ink-3">
          QR
          <br />
          code
        </span>
      </div>
      <div className="min-w-[240px] flex-1">
        <p className="text-[13px] font-semibold">Verify this document</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{note}</p>
        <p className="tabular mt-1.5 text-[12.5px]">
          {tenant.theme.portalUrl}/verify · {reference}
        </p>
      </div>
    </div>
  );
}

export function DocumentFooter({ tenant, note }: { tenant: Tenant; note: string }) {
  return (
    <footer className="mt-8 border-t border-rule pt-4">
      <p className="text-[11px] leading-relaxed text-ink-3">{note}</p>
      <p className="mt-2 text-[11px] text-ink-3">
        {tenant.name} · {tenant.stateName} · {tenant.theme.portalUrl}
      </p>
    </footer>
  );
}
