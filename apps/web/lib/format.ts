/** Display helpers. Naira and dates are formatted in exactly one place. */

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const nairaCompact = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function money(amount: number | undefined | null): string {
  return naira.format(amount ?? 0);
}

/** For dashboard tiles, where ₦1,284,300,000.00 would not fit. */
export function moneyShort(amount: number | undefined | null): string {
  return nairaCompact.format(amount ?? 0);
}

export function number(n: number | undefined | null): string {
  return new Intl.NumberFormat('en-NG').format(n ?? 0);
}

export function percent(n: number | undefined | null, dp = 1): string {
  return `${(n ?? 0).toFixed(dp)}%`;
}

const dateFmt = new Intl.DateTimeFormat('en-NG', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFmt = new Intl.DateTimeFormat('en-NG', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function date(iso: string | undefined | null): string {
  if (!iso) return '—';
  return dateFmt.format(new Date(iso));
}

export function dateTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  return dateTimeFmt.format(new Date(iso));
}

/** "3 days overdue" / "due in 12 days" — the phrasing a collections officer reads. */
export function dueLabel(iso: string): { text: string; overdue: boolean } {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { text: `${Math.abs(days)} days overdue`, overdue: true };
  if (days === 0) return { text: 'due today', overdue: false };
  return { text: `due in ${days} days`, overdue: false };
}

/** ENUM_VALUE -> "Enum value" */
export function humanise(value: string): string {
  const s = value.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function taxpayerName(t: {
  businessName?: string;
  firstName?: string;
  surname?: string;
}): string {
  if (t.businessName) return t.businessName;
  return [t.firstName, t.surname].filter(Boolean).join(' ') || 'Unnamed taxpayer';
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
