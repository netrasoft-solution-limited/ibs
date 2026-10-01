import type { Metadata } from 'next';
import Link from 'next/link';

import { listTccApplications } from '@/lib/api';
import { requirePermission } from '@/lib/session';
import type { TccStage } from '@/lib/types';
import { date, humanise, number } from '@/lib/format';
import { TCC_CHAIN } from '@/components/tcc-chain';
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

export const metadata: Metadata = { title: 'Clearance applications' };

export default async function ClearancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('tcc.review.first');
  const sp = await searchParams;

  const [result, all] = await Promise.all([
    listTccApplications({ q: sp.q, stage: sp.stage as TccStage | undefined, page: Number(sp.page ?? 1) }),
    listTccApplications({ page: 1 }),
  ]);

  const everything = (await listTccApplications({ page: 1 })).total;
  const issued = (await listTccApplications({ stage: 'ISSUED' })).total;
  const declined = (await listTccApplications({ stage: 'DECLINED' })).total;
  const inFlight = everything - issued - declined;

  const qs = new URLSearchParams(
    Object.entries(sp).filter(([k, v]) => v && k !== 'page') as [string, string][],
  );
  const baseHref = `/clearance${qs.toString() ? `?${qs}` : ''}`;

  return (
    <>
      <PageHeader
        eyebrow="Clearance"
        title="Tax clearance certificates"
        description="Every application moves through a six-stage review across three named reviewer roles. Each reviewer is recorded against the certificate as it advances, and the applicant is notified at every step."
        actions={
          <LinkButton href="/clearance/queue" variant="primary">
            My review queue
          </LinkButton>
        }
      />

      <TileRow cols={4}>
        <StatTile label="Applications" value={number(everything)} sub="All years of assessment" />
        <StatTile label="In the chain" value={number(inFlight)} sub="Awaiting a reviewer" tone="accent" />
        <StatTile label="Issued" value={number(issued)} sub="Valid for one year" />
        <StatTile label="Declined" value={number(declined)} sub="Returned to the applicant" />
      </TileRow>

      <form method="get" className="mt-5 grid gap-3 rounded-[var(--radius-card)] bg-sunk p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Field label="Search">
            <Input name="q" defaultValue={sp.q ?? ''} placeholder="Certificate number, taxpayer or TIN" />
          </Field>
        </div>
        <Field label="Stage">
          <Select name="stage" defaultValue={sp.stage ?? ''}>
            <option value="">Any stage</option>
            {[...TCC_CHAIN, 'DECLINED' as const].map((s) => (
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
          <Link href="/clearance" className="px-2 pb-2 text-[13px] text-ink-3 hover:text-[var(--tenant-accent)]">
            Reset
          </Link>
        </div>
      </form>

      {result.total === 0 ? (
        <EmptyState title="No clearance application matches those filters." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Certificate</Th>
                <Th>Applicant</Th>
                <Th>Year</Th>
                <Th>Stage</Th>
                <Th>Fee</Th>
                <Th align="right">Applied</Th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((a) => (
                <Tr key={a.id}>
                  <Td mono>
                    <Link href={`/clearance/${a.id}`} className="hover:text-[var(--tenant-accent)]">
                      {a.certificateNumber}
                    </Link>
                  </Td>
                  <Td>
                    <Link href={`/taxpayers/${a.taxpayerId}`} className="hover:text-[var(--tenant-accent)]">
                      {a.taxpayerName}
                    </Link>
                    <span className="tabular block text-[11.5px] text-ink-3">{a.taxpayerTin}</span>
                  </Td>
                  <Td mono className="text-ink-2">
                    {a.yearOfAssessment}
                  </Td>
                  <Td>
                    {a.stage === 'DECLINED' ? (
                      <Badge tone="danger">Declined</Badge>
                    ) : a.stage === 'ISSUED' ? (
                      <Badge tone="ok">Issued</Badge>
                    ) : (
                      <Badge tone="warn">{humanise(a.stage)}</Badge>
                    )}
                  </Td>
                  <Td>{a.feePaid ? <Badge tone="ok">Paid</Badge> : <Badge tone="danger">Unpaid</Badge>}</Td>
                  <Td align="right" mono className="text-ink-3">
                    {date(a.appliedAt)}
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
