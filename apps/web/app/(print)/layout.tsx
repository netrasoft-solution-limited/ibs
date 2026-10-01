import Link from 'next/link';

/**
 * Documents escape the application shell entirely.
 *
 * No rail, no sidebar, no search — a printed instrument carries the Service's
 * identity and nothing of the software that produced it. These routes are also
 * deliberately public: a citizen prints a bill and carries it to a bank
 * counter, and requiring an account to do that would defeat the point.
 */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <div className="no-print mx-auto flex max-w-[820px] items-center justify-between gap-4 px-6 pt-6">
        <Link href="/" className="text-[13px] text-ink-2 hover:text-[var(--tenant-accent)]">
          ← Back to the public site
        </Link>
        <p className="text-[12px] text-ink-3">This page is formatted for A4.</p>
      </div>
      {children}
    </div>
  );
}
