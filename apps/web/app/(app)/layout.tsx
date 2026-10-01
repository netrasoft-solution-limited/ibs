import Link from 'next/link';
import { redirect } from 'next/navigation';

import { logoutAction } from '../actions';
import { IconRail, Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { ChevronIcon, SearchIcon } from '@/components/icons';
import { landingRoute, visibleSections } from '@/components/nav';
import { getTenant } from '@/lib/api';
import { getCurrentUser } from '@/lib/session';
import { humanise, initials } from '@/lib/format';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.type === 'TAXPAYER') redirect('/portal');

  const tenant = await getTenant();
  const sections = visibleSections(user.permissions);
  const landing = landingRoute(user.permissions);

  return (
    <div className="min-h-screen bg-page p-3 sm:p-5">
      {/* The whole application sits on one rounded panel. */}
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1720px] flex-col overflow-hidden rounded-[var(--radius-shell)] bg-paper shadow-lift">
        {/* Header spans the full width: identity left, search and actions right. */}
        <header className="no-print flex flex-wrap items-center gap-4 px-5 py-4">
          <Link href={landing} className="flex shrink-0 items-center gap-2.5 lg:w-[236px]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-deep text-[15px] font-semibold text-white">
              {tenant.theme.crestInitials}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1 text-[15px] font-semibold">
                {tenant.shortName}
                <ChevronIcon className="h-3.5 w-3.5 text-ink-3" />
              </span>
              <span className="block truncate text-[11.5px] text-ink-3">{tenant.stateName}</span>
            </span>
          </Link>

          <MobileNav sections={sections} />

          <label className="flex h-11 min-w-[200px] flex-1 items-center gap-2.5 rounded-full bg-raised px-4 shadow-soft">
            <SearchIcon className="h-4 w-4 shrink-0 text-ink-3" />
            <input
              placeholder="Try searching “outstanding”"
              className="w-full bg-transparent text-[13.5px] placeholder:text-ink-3 focus:outline-none"
            />
          </label>

          <div className="flex shrink-0 items-center gap-2.5">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] leading-tight font-medium">{user.fullName}</p>
              <p className="text-[11.5px] text-ink-3">
                {humanise(user.type)}
                {user.mdaName ? ` · ${user.mdaName}` : ''}
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-raised text-[12.5px] font-medium text-ink-2 shadow-soft">
              {initials(user.fullName)}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full bg-raised px-4 py-2.5 text-[13px] font-medium text-ink-2 shadow-soft transition-colors hover:text-ink"
              >
                Sign out
              </button>
            </form>

            {/* The one always-available create action, as in the reference. */}
            {user.permissions.includes('invoice.create') ? (
              <Link
                href="/invoices/new"
                title="Raise an invoice"
                aria-label="Raise an invoice"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--tenant-accent)] text-[20px] leading-none font-light text-white shadow-soft transition-colors hover:bg-[var(--tenant-accent-dark)]"
              >
                +
              </Link>
            ) : null}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 gap-0">
          <div className="hidden lg:block">
            <IconRail sections={sections} />
          </div>

          <aside className="hidden w-[196px] shrink-0 overflow-y-auto lg:block">
            <Sidebar sections={sections} />
          </aside>

          {/* Content is a white card floating on the panel. */}
          <main className="min-w-0 flex-1 px-5 pb-5 lg:pl-0">
            <div className="min-h-full rounded-[var(--radius-card)] bg-raised px-6 py-6 shadow-soft">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
