import type { Metadata } from 'next';
import Link from 'next/link';

import { listTccQueue } from '@/lib/api';
import { requirePermission } from '@/lib/session';
import { date, humanise, number } from '@/lib/format';
import { STAGE_ROLE } from '@/components/tcc-chain';
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  StatTile,
  Table,
  Td,
  Th,
  TileRow,
  Tr,
} from '@/components/ui';

export const metadata: Metadata = { title: 'My review queue' };

const ROLE_LABEL: Record<string, string> = {
  'tcc.review.first': 'First reviewer',
  'tcc.review.second': 'Second reviewer',
  'tcc.issue': 'Director',
};

export default async function ClearanceQueuePage() {
  const user = await requirePermission('tcc.review.first');
  const queue = await listTccQueue(user.permissions);

  const roles = Object.keys(ROLE_LABEL).filter((k) => user.permissions.includes(k));
  const blocked = queue.filter((a) => !a.feePaid);
  const oldest = queue[0];

  return (
    <>
      <PageHeader
        eyebrow="Clearance"
        title="My review queue"
        description="Applications sitting at a stage your role owns, oldest first. A stage belongs to exactly one role, so nothing here is also on another officer's queue."
      />

      <TileRow cols={4}>
        <StatTile label="Awaiting you" value={number(queue.length)} tone="accent" sub="Across your stages" />
        <StatTile
          label="Blocked on fee"
          value={number(blocked.length)}
          sub="Cannot advance until settled"
          tone={blocked.length ? 'danger' : 'default'}
        />
        <StatTile
          label="Oldest waiting"
          value={oldest ? date(oldest.appliedAt) : '—'}
          sub={oldest ? oldest.certificateNumber : undefined}
        />
        <StatTile
          label="Your roles"
          value={String(roles.length)}
          sub={roles.map((r) => ROLE_LABEL[r]).join(' · ')}
        />
      </TileRow>

      {queue.length === 0 ? (
        <EmptyState
          title="Nothing is waiting on you."
          hint="Applications appear here the moment they reach a stage your role owns."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Certificate</Th>
              <Th>Applicant</Th>
              <Th>Your action</Th>
              <Th>Fee</Th>
              <Th align="right">Waiting since</Th>
              <Th align="right" />
            </tr>
          </thead>
          <tbody>
            {queue.map((a) => {
              const mine = STAGE_ROLE[a.stage];
              return (
                <Tr key={a.id}>
                  <Td mono>
                    <Link href={`/clearance/${a.id}`} className="hover:text-[var(--tenant-accent)]">
                      {a.certificateNumber}
                    </Link>
                  </Td>
                  <Td>
                    {a.taxpayerName}
                    <span className="tabular block text-[11.5px] text-ink-3">{a.taxpayerTin}</span>
                  </Td>
                  <Td>
                    <Badge tone="warn">{humanise(a.stage)}</Badge>
                    <span className="mt-1 block text-[11.5px] text-ink-3">
                      {mine ? ROLE_LABEL[mine] : '—'}
                    </span>
                  </Td>
                  <Td>{a.feePaid ? <Badge tone="ok">Paid</Badge> : <Badge tone="danger">Unpaid</Badge>}</Td>
                  <Td align="right" mono className="text-ink-3">
                    {date(a.appliedAt)}
                  </Td>
                  <Td align="right">
                    <Link
                      href={`/clearance/${a.id}`}
                      className="rounded-full bg-deep px-3 py-1.5 text-[12.5px] font-medium text-white"
                    >
                      Review
                    </Link>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <Card className="mt-6 bg-warn-bg/60">
        <p className="text-[12.5px] leading-relaxed text-ink-2">
          A queue is only as honest as the permission behind it. These rows are selected from the stages
          your grants cover — change the grant and the queue changes, without a role name anywhere in the
          query.
        </p>
      </Card>
    </>
  );
}
