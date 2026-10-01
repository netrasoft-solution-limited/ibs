import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="max-w-[52ch] text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-[28px] leading-tight">That page does not exist</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
          The record may have been removed, or the address may be wrong. If you reached this from a link
          inside the platform, the audit trail will have recorded it.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-[var(--tenant-accent)] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[var(--tenant-accent-dark)]"
        >
          Return to the public site
        </Link>
      </div>
    </main>
  );
}
