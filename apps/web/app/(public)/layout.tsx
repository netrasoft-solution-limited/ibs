import Link from 'next/link';

import { getTenant } from '@/lib/api';

const LINKS = [
  ['/pay', 'Pay a bill'],
  ['/verify', 'Verify a receipt'],
  ['/eservices', 'Self service'],
];

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant();

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 rounded-full bg-raised px-5 py-3 shadow-soft">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-deep text-[13px] font-semibold text-white">
              {tenant.theme.crestInitials}
            </span>
            <span>
              <span className="block text-[14px] font-medium leading-tight">{tenant.shortName}</span>
              <span className="block text-[11.5px] text-ink-3">
                {tenant.stateName}
              </span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-1">
            {LINKS.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full px-4 py-2 text-[13.5px] text-ink-2 transition-colors hover:bg-sunk hover:text-ink"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/login"
              className="ml-1 rounded-full bg-[var(--tenant-accent)] px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-[var(--tenant-accent-dark)]"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-3 py-6 sm:px-5"><div className="rounded-[var(--radius-shell)] bg-paper p-6 shadow-soft sm:p-9">{children}</div></main>

      <footer>
        <div className="mx-auto flex max-w-[1120px] flex-wrap justify-between gap-3 px-8 pb-8 text-[12.5px] text-ink-3">
          <span>
            {tenant.name} · {tenant.stateName}
          </span>
          <span>{tenant.theme.portalUrl}</span>
        </div>
      </footer>
    </div>
  );
}
