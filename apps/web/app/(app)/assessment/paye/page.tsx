import type { Metadata } from 'next';
import Link from 'next/link';

import { getPayeSummary, listEmployers } from '@/lib/api';
import { requirePermission } from '@/lib/session';
import { date, humanise, money, moneyShort, number } from '@/lib/format';
import {
  Badge,
  EmptyState,
  Field,
  Input,
  LinkButton,
  PageHeader,
  Pagination,
  Select,
  StatTile,
  Table,
  Td,
  Th,
  TileRow,
  Tr,
} from '@/components/ui';

export const metadata: Metadata = { title: 'PAYE employers' };

export default async function PayeEmployersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('assessment.paye');
  const sp = await searchParams;

  const [result, summary] = await Promise.all([
    listEmployers({ q: sp.q, sector: sp.sector, page: Number(sp.page ?? 1) }),
    getPayeSummary(),
  ]);

  const qs = new URLSearchParams(
    Object.entries(sp).filter(([k, v]) => v && k !== 'page') as [string, string][],
  );
  const baseHref = `/assessment/paye${qs.toString() ? `?${qs}` : ''}`;

  return (
    <>
      <PageHeader
        eyebrow="Assessment"
        title="Pay as you earn"
        description="Employers remit on behalf of their staff. Each employer's liability is computed from its own payroll against the statutory bands — never stored, so it cannot drift when a salary changes."
        actions={
          <>
            <LinkButton href="/assessment/paye/calculator">Calculator</LinkButton>
            <LinkButton href="/assessment/paye/employers/new" variant="primary">
              Register employer
            </LinkButton>
          </>
        }
      />

      <TileRow cols={5}>
        <StatTile
          label="Monthly liability"
          value={moneyShort(summary.monthlyDue)}
          sub="Computed from all rosters"
          tone="accent"
        />
        <StatTile
          label="Outstanding remittance"
          value={moneyShort(summary.outstanding)}
          sub={`${number(summary.behind)} employers behind`}
          tone="danger"
        />
        <StatTile label="Employers" value={number(summary.employers)} sub={`${number(summary.active)} active`} />
        <StatTile label="Staff on payroll" value={number(summary.staff)} sub="Across all employers" />
        <StatTile
          label="Public sector"
          value={number(summary.publicSector)}
          sub="Administered separately"
        />
      </TileRow>

      <form method="get" className="mt-5 grid gap-3 rounded-[var(--radius-card)] bg-sunk p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Field label="Search">
            <Input name="q" defaultValue={sp.q ?? ''} placeholder="Employer name, TIN or area" />
          </Field>
        </div>
        <Field label="Sector">
          <Select name="sector" defaultValue={sp.sector ?? ''}>
            <option value="">Both sectors</option>
            <option value="PRIVATE">Private</option>
            <option value="PUBLIC">Public</option>
          </Select>
        </Field>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-full bg-deep px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-ink"
          >
            Apply
          </button>
          <Link href="/assessment/paye" className="px-2 pb-2 text-[13px] text-ink-3 hover:text-[var(--tenant-accent)]">
            Reset
          </Link>
        </div>
      </form>

      {result.total === 0 ? (
        <EmptyState title="No employer matches those filters." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Employer</Th>
                <Th>Sector</Th>
                <Th>Area</Th>
                <Th align="right">Staff</Th>
                <Th align="right">Annual payroll</Th>
                <Th align="right">Monthly PAYE</Th>
                <Th>Remittance</Th>
                <Th align="right">Registered</Th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((e) => (
                <Tr key={e.id}>
                  <Td>
                    <Link
                      href={`/assessment/paye/employers/${e.id}`}
                      className="font-medium hover:text-[var(--tenant-accent)]"
                    >
                      {e.name}
                    </Link>
                    <span className="tabular block text-[11.5px] text-ink-3">{e.tin}</span>
                  </Td>
                  <Td>
                    <Badge tone={e.sector === 'PUBLIC' ? 'info' : 'neutral'}>{humanise(e.sector)}</Badge>
                  </Td>
                  <Td>
                    <span className="text-[12.5px] text-ink-2">{e.lgaName}</span>
                  </Td>
                  <Td align="right" mono>
                    {number(e.staffCount)}
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {moneyShort(e.annualGrossPayroll)}
                  </Td>
                  <Td align="right" mono>
                    {money(e.monthlyPayeDue)}
                  </Td>
                  <Td>
                    {(e.monthsOutstanding ?? 0) === 0 ? (
                      <Badge tone="ok">Up to date</Badge>
                    ) : (
                      <Badge tone="danger">{e.monthsOutstanding} months behind</Badge>
                    )}
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {date(e.registeredAt)}
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
