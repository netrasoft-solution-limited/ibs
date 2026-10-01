import Link from 'next/link';

import { getTenant } from '@/lib/api';

const SERVICES = [
  {
    href: '/pay',
    eyebrow: 'Collection',
    title: 'Pay a bill by its number',
    body: 'Enter an invoice or demand notice number, see what is owed, and settle it. A receipt is issued the same moment.',
  },
  {
    href: '/verify',
    eyebrow: 'Verification',
    title: 'Verify an invoice or receipt',
    body: 'Confirm that a bill or a receipt is genuine, and what it settled, without an account.',
  },
  {
    href: '/eservices',
    eyebrow: 'Self service',
    title: 'Register and obtain a TIN',
    body: 'Individuals, businesses and agencies register themselves. A Tax Identification Number follows a three-stage review.',
  },
  {
    href: '/eservices',
    eyebrow: 'Assessment',
    title: 'Work out what you owe',
    body: 'Pay-as-you-earn and presumptive calculators, using exactly the rules the Service assesses on.',
  },
];

export default async function PublicHomePage() {
  const tenant = await getTenant();

  return (
    <>
      <section className="pb-8">
        <p className="eyebrow">{tenant.name}</p>
        <h1 className="mt-3 max-w-[19ch] text-[clamp(32px,5vw,52px)] font-semibold leading-[1.06]">
          Revenue services for{' '}
          <em className="italic text-[var(--tenant-accent)]">{tenant.stateName}</em>
        </h1>
        <p className="mt-4 max-w-[62ch] text-[16px] leading-relaxed text-ink-2">
          Register, obtain a tax identification number, work out what you owe, raise an invoice and pay it
          — start to finish, without creating an account.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/pay"
            className="rounded-full bg-[var(--tenant-accent)] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[var(--tenant-accent-dark)]"
          >
            Pay a bill
          </Link>
          <Link
            href="/eservices"
            className="rounded-full bg-raised px-5 py-2.5 text-[14px] text-ink-2 shadow-soft transition-colors hover:text-ink"
          >
            All services
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        {SERVICES.map((s) => (
          <Link key={s.title} href={s.href} className="group rounded-[var(--radius-card)] bg-raised p-6 shadow-soft transition-shadow hover:shadow-lift">
            <p className="eyebrow">{s.eyebrow}</p>
            <h2 className="mt-2 text-[19px] font-semibold group-hover:text-[var(--tenant-accent)]">{s.title}</h2>
            <p className="mt-2 max-w-[46ch] text-[13.5px] leading-relaxed text-ink-2">{s.body}</p>
          </Link>
        ))}
      </section>

      <section className="mt-3 rounded-[var(--radius-card)] bg-deep p-7 text-white">
        <h2 className="text-[19px] font-semibold">Paying is the easy part, and it should be</h2>
        <p className="mt-2.5 max-w-[74ch] text-[13.5px] leading-relaxed text-white/70">
          Every bill carries a number. That number is all you need — online by card or transfer, or in
          person at a bank branch against a printed invoice. Settlement posts against the bill
          automatically, duplicate payments are refused rather than reconciled later, and the receipt can
          be verified by anyone who needs to check it.
        </p>
      </section>
    </>
  );
}
