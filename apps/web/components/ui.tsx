/**
 * Interface primitives.
 *
 * A deliberately small, closed set. Cards are 20px-rounded white on a warm
 * neutral ground; anything interactive is a pill. A revenue platform is read by
 * clerks for eight hours a day, so consistency matters more than expressiveness.
 * Everything is a server component unless it needs state.
 */

import Link from 'next/link';
import type { ReactNode } from 'react';

import { humanise } from '@/lib/format';

// ------------------------------------------------------------ page furniture

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
        <h1 className="text-[30px] leading-[1.1] font-semibold">{title}</h1>
        {description ? (
          <p className="mt-2.5 max-w-[70ch] text-[13.5px] leading-relaxed text-ink-2">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[16px] font-semibold">{title}</h2>
        {hint ? <span className="eyebrow">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

/** Grouping container. Light grey, because it nests inside a white panel. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[var(--radius-card)] bg-sunk p-5 ${className}`}>{children}</div>;
}

/** Near-black card, for the one figure on a screen that outranks the others. */
export function DarkCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[var(--radius-card)] bg-deep p-5 text-white shadow-lift ${className}`}>
      {children}
    </div>
  );
}

// ------------------------------------------------------------------- tiles

export function StatTile({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'accent' | 'danger';
}) {
  // Exactly one tile in a row carries the crimson outline — the accent one.
  // Everything else takes the hairline, so the outline still means something.
  // A danger tile says so through its figure, not through a second outline.
  const ring = tone === 'accent' ? 'ring-1 ring-[var(--tenant-accent)]' : 'ring-1 ring-rule-2';
  const valueTone =
    tone === 'accent' ? 'text-[var(--tenant-accent)]' : tone === 'danger' ? 'text-danger' : 'text-ink';

  return (
    <div className={`rounded-[var(--radius-card)] bg-raised p-4 ${ring}`}>
      <p className="eyebrow">{label}</p>
      <p className={`tabular mt-2.5 text-[24px] leading-none font-semibold ${valueTone}`}>{value}</p>
      {sub ? <p className="mt-2 text-[12px] leading-snug text-ink-3">{sub}</p> : null}
    </div>
  );
}

export function TileRow({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 | 5 | 6 }) {
  const template = {
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-3 lg:grid-cols-5',
    6: 'sm:grid-cols-3 lg:grid-cols-6',
  }[cols];
  return <div className={`mt-5 grid grid-cols-1 gap-3 ${template}`}>{children}</div>;
}

// ------------------------------------------------------------------ badges

type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'accent';

const TONE_CLASS: Record<Tone, string> = {
  ok: 'text-ok bg-ok-bg',
  warn: 'text-warn bg-warn-bg',
  danger: 'text-danger bg-danger-bg',
  info: 'text-info bg-info-bg',
  neutral: 'text-ink-2 bg-sunk',
  accent: 'text-white bg-[var(--tenant-accent)]',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`tabular inline-block rounded-full px-2 py-[3px] text-[11px] font-medium whitespace-nowrap ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, Tone> = {
  PAID: 'ok',
  SUCCESSFUL: 'ok',
  APPROVED: 'ok',
  ACTIVE: 'ok',
  PART_PAID: 'warn',
  PENDING: 'warn',
  SUBMITTED: 'warn',
  UNDER_REVIEW: 'warn',
  UNPAID: 'danger',
  FAILED: 'danger',
  DECLINED: 'danger',
  REVERSED: 'danger',
  CANCELLED: 'neutral',
  EXPIRED: 'neutral',
};

/** One place decides what colour a status is, everywhere it appears. */
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{humanise(status)}</Badge>;
}

// ----------------------------------------------------------------- buttons

type ButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  className?: string;
};

function buttonClass({ variant = 'secondary', size = 'md', className = '' }: Omit<ButtonProps, 'children'>) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors disabled:opacity-50';
  const sizing = size === 'sm' ? 'px-3 py-1.5 text-[12.5px]' : 'px-4 py-2 text-[13.5px]';
  const tone = {
    primary: 'bg-deep text-white hover:bg-ink',
    accent: 'bg-[var(--tenant-accent)] text-white hover:bg-[var(--tenant-accent-dark)]',
    secondary: 'bg-raised text-ink-2 shadow-soft hover:text-ink',
    ghost: 'text-ink-3 hover:bg-sunk hover:text-ink',
  }[variant];
  return `${base} ${sizing} ${tone} ${className}`;
}

export function Button({
  children,
  variant,
  size,
  className,
  type = 'button',
  ...rest
}: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={buttonClass({ variant, size, className })} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({ href, children, variant, size, className }: ButtonProps & { href: string }) {
  return (
    <Link href={href} className={buttonClass({ variant, size, className })}>
      {children}
    </Link>
  );
}

/** Submit control for the plain GET filter forms. */
export function SubmitButton({ children = 'Apply' }: { children?: ReactNode }) {
  return (
    <button
      type="submit"
      className="inline-flex items-center rounded-full bg-deep px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-ink"
    >
      {children}
    </button>
  );
}

// ------------------------------------------------------------------ tables

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="scroll-x mt-4">
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  );
}

export function Th({
  children,
  align = 'left',
  width,
}: {
  children?: ReactNode;
  align?: 'left' | 'right';
  width?: string;
}) {
  return (
    <th
      style={width ? { width } : undefined}
      className={`px-3 pt-2 pb-2.5 text-[11.5px] font-medium whitespace-nowrap text-ink-3 ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  className = '',
  mono = false,
}: {
  children?: ReactNode;
  align?: 'left' | 'right';
  className?: string;
  mono?: boolean;
}) {
  return (
    <td
      className={`border-t border-rule px-3 py-3 align-top ${align === 'right' ? 'text-right' : ''} ${
        mono ? 'tabular whitespace-nowrap' : ''
      } ${className}`}
    >
      {children}
    </td>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="transition-colors hover:bg-sunk/70">{children}</tr>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mt-4 rounded-[var(--radius-card)] bg-sunk px-6 py-14 text-center">
      <p className="text-[15px] text-ink-2">{title}</p>
      {hint ? <p className="mt-1.5 text-[13px] text-ink-3">{hint}</p> : null}
    </div>
  );
}

// -------------------------------------------------------------- pagination

export function Pagination({
  page,
  pageSize,
  total,
  baseHref,
}: {
  page: number;
  pageSize: number;
  total: number;
  baseHref: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const join = baseHref.includes('?') ? '&' : '?';

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
      <p className="tabular text-[12px] text-ink-3">
        {from}–{to} of {total.toLocaleString('en-NG')}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <LinkButton size="sm" href={`${baseHref}${join}page=${page - 1}`}>
            ← Previous
          </LinkButton>
        ) : null}
        <span className="tabular text-[12px] text-ink-3">
          {page} / {pages}
        </span>
        {page < pages ? (
          <LinkButton size="sm" href={`${baseHref}${join}page=${page + 1}`}>
            Next →
          </LinkButton>
        ) : null}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- forms

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[11.5px] text-ink-3">{hint}</span> : null}
    </label>
  );
}

const CONTROL =
  'w-full rounded-full bg-raised px-4 py-2.5 text-[13.5px] text-ink ring-1 ring-rule-2 placeholder:text-ink-3 focus:ring-[var(--tenant-accent)] focus:outline-none transition-[box-shadow]';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CONTROL} ${props.className ?? ''}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${CONTROL} appearance-none ${props.className ?? ''}`} />;
}

/** The filter bar every list screen carries. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mt-5 rounded-[var(--radius-card)] bg-sunk p-4">{children}</div>;
}

/** Definition list used on every detail screen. */
export function DefList({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl>
      {rows.map(([term, value]) => (
        <div key={term} className="flex justify-between gap-6 border-b border-rule py-2.5 last:border-b-0">
          <dt className="text-[13px] text-ink-3">{term}</dt>
          <dd className="text-right text-[13px] font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Horizontal bar for league tables — no chart library for one bar. */
export function BarRow({
  label,
  value,
  max,
  formatted,
}: {
  label: string;
  value: number;
  max: number;
  formatted: string;
}) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="border-b border-rule py-2.5 last:border-b-0">
      <div className="flex items-baseline justify-between gap-4">
        <span className="truncate text-[13px] text-ink-2">{label}</span>
        <span className="tabular shrink-0 text-[12.5px] font-medium">{formatted}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sunk">
        <div className="h-full rounded-full bg-[var(--tenant-accent)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Headline figure with the decimal tail set back, as in the reference. */
export function BigMoney({ value, className = '' }: { value: string; className?: string }) {
  const [whole, decimals] = value.split('.');
  return (
    <span className={`tabular text-[40px] leading-none font-semibold ${className}`}>
      {whole}
      {decimals ? <span className="decimals">.{decimals}</span> : null}
    </span>
  );
}
