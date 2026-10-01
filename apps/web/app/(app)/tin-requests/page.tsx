import type { Metadata } from 'next';
import Link from 'next/link';

import { listTaxpayers } from '@/lib/api';
import type { TinStatus } from '@/lib/types';
import { date, humanise, number, taxpayerName } from '@/lib/format';
import {
  Card,
  EmptyState,
  PageHeader,
  Section,
  StatTile,
  StatusBadge,
  Table,
  Td,
  Th,
  TileRow,
  Tr,
} from '@/components/ui';
import { requirePermission } from '@/lib/session';

export const metadata: Metadata = { title: 'TIN requests' };

/** The three-stage chain a request passes through before a TIN is issued. */
const CHAIN: Array<{ status: TinStatus; label: string; note: string }> = [
  { status: 'SUBMITTED', label: 'Submitted', note: 'Registration complete, awaiting first check' },
  { status: 'UNDER_REVIEW', label: 'Under review', note: 'With an officer for verification' },
  { status: 'APPROVED', label: 'Approved', note: 'Identifier issued to the taxpayer' },
];

export default async function TinRequestsPage() {
  await requirePermission('tin.review');
  const [pending, submitted, underReview, declined] = await Promise.all([
    listTaxpayers({ tinStatus: 'PENDING', pageSize: 100 }),
    listTaxpayers({ tinStatus: 'SUBMITTED', pageSize: 100 }),
    listTaxpayers({ tinStatus: 'UNDER_REVIEW', pageSize: 100 }),
    listTaxpayers({ tinStatus: 'DECLINED', pageSize: 100 }),
  ]);

  // Everything not yet resolved, oldest first — a queue, not a register.
  const queue = [...submitted.rows, ...underReview.rows, ...pending.rows].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  return (
    <>
      <PageHeader
        eyebrow="Taxpayers"
        title="TIN requests"
        description="A Tax Identification Number is issued only after a three-stage review. The identifier encodes the year of issue and the taxpayer's local government area, so where a taxpayer belongs is readable from the number itself."
      />

      <TileRow cols={4}>
        <StatTile label="Awaiting action" value={number(queue.length)} sub="Across all three stages" tone={queue.length ? 'danger' : 'default'} />
        <StatTile label="Submitted" value={number(submitted.total)} sub="Not yet picked up" />
        <StatTile label="Under review" value={number(underReview.total)} sub="With an officer" />
        <StatTile label="Declined" value={number(declined.total)} sub="Returned to the applicant" />
      </TileRow>

      <Section title="The review chain" hint="Three stages, sequential">
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {CHAIN.map((stage, i) => (
            <div key={stage.status} className="flex items-center gap-2">
              <div
                className={`rounded-[var(--radius-control)] border px-3 py-2 ${
                  i === CHAIN.length - 1
                    ? 'border-[var(--tenant-accent)] bg-[var(--tenant-accent)] text-white'
                    : 'border-rule-2 bg-raised'
                }`}
              >
                <p className="font-mono text-[11.5px]">{stage.label}</p>
                <p className={`text-[11px] ${i === CHAIN.length - 1 ? 'text-white/75' : 'text-ink-3'}`}>
                  {stage.note}
                </p>
              </div>
              {i < CHAIN.length - 1 ? <span className="text-ink-3">→</span> : null}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Queue" hint="Oldest request first">
        {queue.length === 0 ? (
          <EmptyState title="No TIN request is awaiting action." hint="Every submitted request has been resolved." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Applicant</Th>
                <Th>Proposed TIN</Th>
                <Th>Category</Th>
                <Th>Area</Th>
                <Th>Stage</Th>
                <Th align="right">Waiting since</Th>
              </tr>
            </thead>
            <tbody>
              {queue.slice(0, 40).map((t) => (
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
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {date(t.createdAt)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      {declined.total > 0 ? (
        <Section title="Declined" hint="Returned to the applicant">
          <Card className="mt-4">
            <p className="text-[13px] leading-relaxed text-ink-2">
              {number(declined.total)} requests were declined. A declined request is not deleted — the
              record and the reason stay on the register, and the applicant may correct and resubmit.
            </p>
            <div className="mt-3">
              <Link href="/taxpayers?tinStatus=DECLINED" className="text-[13px] text-[var(--tenant-accent)]">
                Review declined requests →
              </Link>
            </div>
          </Card>
        </Section>
      ) : null}
    </>
  );
}
