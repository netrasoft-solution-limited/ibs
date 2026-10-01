import type { Metadata } from 'next';
import Link from 'next/link';

import { listLgas, listTaxpayers } from '@/lib/api';
import type { TaxpayerCategory, TinStatus } from '@/lib/types';
import { date, humanise, money, number, taxpayerName } from '@/lib/format';
import {
  Badge,
  EmptyState,
  Field,
  Input,
  LinkButton,
  PageHeader,
  Pagination,
  Select,
  StatusBadge,
  Table,
  Td,
  Th,
  Tr,
} from '@/components/ui';
import { requirePermission } from '@/lib/session';

export const metadata: Metadata = { title: 'Taxpayer register' };

const CATEGORIES: TaxpayerCategory[] = ['INDIVIDUAL', 'CORPORATE', 'STATE_AGENCY', 'FEDERAL_AGENCY'];
const STATUSES: TinStatus[] = ['APPROVED', 'UNDER_REVIEW', 'SUBMITTED', 'PENDING', 'DECLINED'];

export default async function TaxpayersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('taxpayer.view');
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const [result, lgas] = await Promise.all([
    listTaxpayers({
      q: sp.q,
      category: sp.category as TaxpayerCategory | undefined,
      tinStatus: sp.tinStatus as TinStatus | undefined,
      lgaId: sp.lgaId,
      page,
    }),
    listLgas(),
  ]);

  // Preserve the active filters when paging.
  const qs = new URLSearchParams(
    Object.entries(sp).filter(([k, v]) => v && k !== 'page') as [string, string][],
  );
  const baseHref = `/taxpayers${qs.toString() ? `?${qs}` : ''}`;

  return (
    <>
      <PageHeader
        eyebrow="Taxpayers"
        title="Taxpayer register"
        description="Every individual, company and agency liable in the state. Searchable by name, TIN, email, phone or local government area."
        actions={
          <>
            <LinkButton href="/tin-requests">TIN requests</LinkButton>
            <LinkButton href="/taxpayers/new" variant="primary">
              Register taxpayer
            </LinkButton>
          </>
        }
      />

      <form method="get" className="mt-5 grid gap-3 rounded-[var(--radius-card)] bg-sunk p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Field label="Search">
            <Input name="q" defaultValue={sp.q ?? ''} placeholder="Name, TIN, email or phone" />
          </Field>
        </div>
        <Field label="Category">
          <Select name="category" defaultValue={sp.category ?? ''}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {humanise(c)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="TIN status">
          <Select name="tinStatus" defaultValue={sp.tinStatus ?? ''}>
            <option value="">Any status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {humanise(s)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Local government area">
          <Select name="lgaId" defaultValue={sp.lgaId ?? ''}>
            <option value="">All 13 areas</option>
            {lgas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <button
            type="submit"
            className="rounded-full bg-deep px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-ink"
          >
            Apply filters
          </button>
          <Link href="/taxpayers" className="px-2 text-[13px] text-ink-3 hover:text-[var(--tenant-accent)]">
            Reset
          </Link>
        </div>
      </form>

      {result.total === 0 ? (
        <EmptyState title="No taxpayer matches those filters." hint="Widen the search or reset the filters." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Taxpayer</Th>
                <Th>TIN</Th>
                <Th>Category</Th>
                <Th>Area</Th>
                <Th>TIN status</Th>
                <Th align="right">Bills</Th>
                <Th align="right">Outstanding</Th>
                <Th align="right">Registered</Th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((t) => (
                <Tr key={t.id}>
                  <Td>
                    <Link href={`/taxpayers/${t.id}`} className="font-medium hover:text-[var(--tenant-accent)]">
                      {taxpayerName(t)}
                    </Link>
                    <span className="block text-[11.5px] text-ink-3">{t.email}</span>
                  </Td>
                  <Td mono>{t.tin}</Td>
                  <Td>
                    <span className="text-[12.5px] text-ink-2">{humanise(t.category)}</span>
                  </Td>
                  <Td>
                    <span className="text-[12.5px] text-ink-2">{t.lgaName}</span>
                  </Td>
                  <Td>
                    <StatusBadge status={t.tinStatus} />
                    {!t.isActive ? (
                      <span className="ml-1.5">
                        <Badge tone="neutral">Inactive</Badge>
                      </span>
                    ) : null}
                  </Td>
                  <Td align="right" mono>
                    {number(t.invoiceCount)}
                  </Td>
                  <Td align="right" mono className={t.outstandingAmount ? 'text-danger' : 'text-ink-3'}>
                    {money(t.outstandingAmount)}
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {date(t.createdAt)}
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
