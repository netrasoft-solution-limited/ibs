'use client';

/**
 * The only client component on a printed document.
 *
 * It disappears from the printed sheet through `.no-print`, so what the
 * taxpayer holds carries no controls.
 */
export function PrintButton({ label = 'Print' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-deep px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-ink"
    >
      {label}
    </button>
  );
}
