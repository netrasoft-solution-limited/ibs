import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Self service' };

const SERVICES = [
  {
    eyebrow: 'Registration',
    title: 'Register and request a TIN',
    body: 'Individuals, companies, and state and federal agencies register through one guided form. Your email is verified by a one-time code, and the request passes a three-stage review before a Tax Identification Number is issued.',
    href: '/login',
    cta: 'Begin registration',
    ready: false,
  },
  {
    eyebrow: 'Collection',
    title: 'Pay a bill',
    body: 'Enter an invoice or demand notice number, see exactly what is owed and what it covers, and settle it. A receipt is issued the same moment the payment posts.',
    href: '/pay',
    cta: 'Pay by invoice number',
    ready: true,
  },
  {
    eyebrow: 'Verification',
    title: 'Verify an invoice or receipt',
    body: 'Confirm that a document issued in the name of the Service is genuine, and see what it settled. Useful to anyone asked to accept a receipt as proof.',
    href: '/verify',
    cta: 'Verify a number',
    ready: true,
  },
  {
    eyebrow: 'Clearance',
    title: 'Apply for a tax clearance certificate',
    body: 'Apply online, pay the fee, and follow the application through its review stages. The certificate is valid for one year and carries a QR code for third-party checks.',
    href: '/login',
    cta: 'Apply for clearance',
    ready: false,
  },
  {
    eyebrow: 'Assessment',
    title: 'Work out what you owe',
    body: 'Pay-as-you-earn and presumptive tax calculators, applying exactly the statutory rules the Service assesses on — the same code, not a separate copy that drifts.',
    href: '/login',
    cta: 'Open the calculators',
    ready: false,
  },
  {
    eyebrow: 'Employers',
    title: 'Run payroll tax',
    body: 'Upload your payroll once and the platform computes each employee’s monthly liability against the statutory bands and reliefs, then tracks remittance across the schedule.',
    href: '/login',
    cta: 'Employer sign-in',
    ready: false,
  },
];

export default function EservicesPage() {
  return (
    <>
      <div>
        <p className="eyebrow">Self service</p>
        <h1 className="mt-2 text-[30px] font-semibold leading-tight">
          Six services, most without an account
        </h1>
        <p className="mt-2 max-w-[64ch] text-[14.5px] leading-relaxed text-ink-2">
          Register, obtain a TIN, assess yourself, file, apply for a clearance certificate, raise an
          invoice and pay it — start to finish.
        </p>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {SERVICES.map((s) => (
          <div key={s.title} className="flex flex-col justify-between rounded-[var(--radius-card)] bg-raised p-6 shadow-soft">
            <div>
              <p className="eyebrow">{s.eyebrow}</p>
              <h2 className="mt-2 text-[19px] font-semibold">{s.title}</h2>
              <p className="mt-2 max-w-[48ch] text-[13.5px] leading-relaxed text-ink-2">{s.body}</p>
            </div>
            <div className="mt-4">
              <Link
                href={s.href}
                className="inline-block rounded-full bg-raised px-4 py-2 text-[13px] text-ink-2 shadow-soft transition-colors hover:text-ink"
              >
                {s.cta} →
              </Link>
              {!s.ready ? (
                <span className="ml-2 text-[11.5px] text-ink-3">
                  Needs the API
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
