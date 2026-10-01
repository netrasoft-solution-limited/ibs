import type { Metadata } from 'next';
import Link from 'next/link';

import { listFilings } from '@/lib/api';
import { requirePermission } from '@/lib/session';
import { date, humanise, money, number } from '@/lib/format';
import {
  EmptyState,
  Field,
  Input,
  PageHeader,
  Pagination,
  Select,
  StatTile,
  StatusBadge,
  Table,
  Td,
  Th,
  TileRow,
  Tr,
} from '@/components/ui';

export const metadata: Metadata = { title: 'Self-assessment filings' };

const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PART_APPROVED', 'REJECTED'];

export default async function FilingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('filing.review');
  const sp = await searchParams;

  const [result, all, submitted, review] = await Promise.all([
    listFilings({ q: sp.q, status: sp.status, page: Number(sp.page ?? 1) }),
    listFilings({ page: 1 }),
    listFilings({ status: 'SUBMITTED' }),
    listFilings({ status: 'UNDER_REVIEW' }),
  ]);

  const qs = new URLSearchParams(
    Object.entries(sp).filter(([k, v]) => v && k !== 'page') as [string, string][],
  );
  const baseHref = `/filings${qs.toString() ? `?${qs}` : ''}`;

  return (
    <>
      <PageHeader
        eyebrow="Assessment"
        title="Self-assessment filings"
        description="Returns declared by the taxpayer with their supporting documents. Each declared tax type is approved or rejected on its own, with a remark on the record — a filing is not accepted or refused as a whole."
      />

      <TileRow cols={4}>
        <StatTile label="Filings received" value={number(all.total)} sub="All periods" />
        <StatTile label="Awaiting first look" value={number(submitted.total)} tone="accent" />
        <StatTile label="Under review" value={number(review.total)} sub="With an officer" />
        <StatTile
          label="Queue"
          value={number(submitted.total + review.total)}
          sub="Unresolved filings"
          tone={submitted.total + review.total > 0 ? 'danger' : 'default'}
        />
      </TileRow>

      <form method="get" className="mt-5 grid gap-3 rounded-[var(--radius-card)] bg-sunk p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Field label="Search">
            <Input name="q" defaultValue={sp.q ?? ''} placeholder="Filing reference, taxpayer or TIN" />
          </Field>
        </div>
        <Field label="Status">
          <Select name="status" defaultValue={sp.status ?? ''}>
            <option value="">Any status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {humanise(s)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-full bg-deep px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-ink"
          >
            Apply
          </button>
          <Link href="/filings" className="px-2 pb-2 text-[13px] text-ink-3 hover:text-[var(--tenant-accent)]">
            Reset
          </Link>
        </div>
      </form>

      {result.total === 0 ? (
        <EmptyState title="No filing matches those filters." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Reference</Th>
                <Th>Taxpayer</Th>
                <Th>Period</Th>
                <Th align="right">Tax types</Th>
                <Th align="right">Declared</Th>
                <Th align="right">Documents</Th>
                <Th>Status</Th>
                <Th align="right">Submitted</Th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((f) => (
                <Tr key={f.id}>
                  <Td mono>
                    <Link href={`/filings/${f.id}`} className="hover:text-[var(--tenant-accent)]">
                      {f.filingReference}
                    </Link>
                  </Td>
                  <Td>
                    <Link href={`/taxpayers/${f.taxpayerId}`} className="hover:text-[var(--tenant-accent)]">
                      {f.taxpayerName}
                    </Link>
                    <span className="tabular block text-[11.5px] text-ink-3">{f.taxpayerTin}</span>
                  </Td>
                  <Td>
                    <span className="text-[12.5px] text-ink-2">{f.period}</span>
                  </Td>
                  <Td align="right" mono>
                    {f.lines.length}
                  </Td>
                  <Td align="right" mono>
                    {money(f.lines.reduce((s, l) => s + l.declaredAmount, 0))}
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {f.documents.length}
                  </Td>
                  <Td>
                    <StatusBadge status={f.status} />
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {date(f.submittedAt)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} baseHref={baseHref} />
        </>
      )}
    </>
  );
}
