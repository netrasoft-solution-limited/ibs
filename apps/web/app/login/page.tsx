import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { LoginForm } from './login-form';
import { getTenant, listDemoLogins } from '@/lib/api';
import { getCurrentUser } from '@/lib/session';
import { landingRoute } from '@/components/nav';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.type === 'TAXPAYER' ? '/portal' : landingRoute(user.permissions));

  const [tenant, demoAccounts] = await Promise.all([getTenant(), listDemoLogins()]);

  return (
    <main className="min-h-screen bg-page p-3 sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1720px] overflow-hidden rounded-[var(--radius-shell)] bg-paper shadow-lift lg:grid-cols-[1.05fr_1fr]">
        {/* Identity panel. One platform, five sign-in types, one form. */}
        <section className="hidden flex-col justify-between p-10 lg:flex">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-deep text-[15px] font-semibold text-white">
              {tenant.theme.crestInitials}
            </span>
            <span>
              <span className="block text-[15px] leading-tight font-semibold">{tenant.shortName}</span>
              <span className="block text-[11.5px] text-ink-3">{tenant.stateName}</span>
            </span>
          </div>

          <div className="rounded-[var(--radius-card)] bg-raised p-9 shadow-soft">
            <p className="eyebrow">{tenant.name}</p>
            <h1 className="mt-3 max-w-[15ch] text-[46px] leading-[1.04] font-semibold">
              Revenue, <span className="text-[var(--tenant-accent)]">assessed to collected</span>
            </h1>
            <p className="mt-5 max-w-[44ch] text-[14.5px] leading-relaxed text-ink-2">
              Registration, assessment, billing, collection, clearance and compliance for{' '}
              {tenant.stateName} — one platform, and nobody sees more than their role allows.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ['27', 'capability areas'],
                ['13', 'local government areas'],
                ['6', 'user groups'],
              ].map(([n, label]) => (
                <div key={label} className="rounded-[var(--radius-inner)] bg-sunk p-3.5">
                  <p className="tabular text-[22px] leading-none font-semibold text-[var(--tenant-accent)]">
                    {n}
                  </p>
                  <p className="mt-1.5 text-[11.5px] leading-snug text-ink-3">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[12px] text-ink-3">{tenant.theme.portalUrl}</p>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-10">
          <div className="w-full max-w-[430px] rounded-[var(--radius-card)] bg-raised p-8 shadow-soft">
            <p className="eyebrow">Sign in</p>
            <h2 className="mt-2 text-[26px] leading-tight font-semibold">Access the platform</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
              Staff, agency users, enumeration agents and taxpayers all sign in here. What you can reach
              afterwards is decided by your permissions.
            </p>

            <LoginForm accounts={demoAccounts} />
          </div>
        </section>
      </div>
    </main>
  );
}
