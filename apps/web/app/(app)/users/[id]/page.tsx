import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getUser, listAuditLogs, listPermissionCatalogue } from '@/lib/api';
import { PERMISSION_CATEGORIES } from '@/lib/permissions';
import { date, dateTime, humanise, number } from '@/lib/format';
import {
  Badge,
  Card,
  DefList,
  EmptyState,
  PageHeader,
  Section,
  StatTile,
  Table,
  Td,
  Th,
  TileRow,
  Tr,
} from '@/components/ui';
import { requirePermission } from '@/lib/session';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await getUser(id);
  return { title: user ? user.fullName : 'User' };
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('user.view');
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  const [catalogue, activity] = await Promise.all([
    listPermissionCatalogue(),
    listAuditLogs({ userId: user.id, pageSize: 15 }),
  ]);

  const held = new Set(user.permissions);
  const denials = activity.rows.filter((a) => a.statusCode === 401 || a.statusCode === 403).length;

  return (
    <>
      <PageHeader
        eyebrow={humanise(user.type)}
        title={user.fullName}
        description={user.mdaName ? `Scoped to ${user.mdaName}.` : 'State-wide scope.'}
      />

      <TileRow cols={4}>
        <StatTile
          label="Permissions held"
          value={`${number(user.permissions.length)} / ${catalogue.length}`}
          tone="accent"
        />
        <StatTile label="Account" value={user.isActive ? 'Active' : 'Deactivated'} sub={`Created ${date(user.createdAt)}`} />
        <StatTile label="Last signed in" value={date(user.lastLoginAt)} />
        <StatTile
          label="Refusals recorded"
          value={number(denials)}
          sub="In the last 15 actions"
          tone={denials ? 'danger' : 'default'}
        />
      </TileRow>

      <div className="mt-9 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <div>
            <h2 className="text-[16px] font-semibold">Account</h2>
          </div>
          <Card className="mt-4">
            <DefList
              rows={[
                ['Email', user.email],
                ['Phone', <span key="p" className="tabular">{user.phone ?? '—'}</span>],
                ['User type', humanise(user.type)],
                ['Agency', user.mdaName ?? '—'],
                ['Email verified', date(user.emailVerifiedAt)],
                [
                  'Status',
                  user.isActive ? <Badge key="s" tone="ok">Active</Badge> : <Badge key="s" tone="neutral">Deactivated</Badge>,
                ],
              ]}
            />
          </Card>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-[16px] font-semibold">Permissions</h2>
            <span className="eyebrow">
              {number(user.permissions.length)} of {catalogue.length} granted
            </span>
          </div>

          <div className="mt-4 space-y-5">
            {PERMISSION_CATEGORIES.map((category) => {
              const inCategory = catalogue.filter((p) => p.category === category);
              const grantedCount = inCategory.filter((p) => held.has(p.key)).length;
              return (
                <div key={category}>
                  <p className="eyebrow mb-2">
                    {category} · {grantedCount}/{inCategory.length}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {inCategory.map((p) => (
                      <span
                        key={p.key}
                        title={p.description}
                        className={`rounded-full border px-2 py-1 font-mono text-[10.5px] ${
                          held.has(p.key)
                            ? 'border-[var(--tenant-accent)]/30 bg-ok-bg text-ok'
                            : 'border-rule bg-sunk/60 text-ink-3 line-through decoration-ink-3/40'
                        }`}
                      >
                        {p.key}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Section title="Recent activity" hint="From the audit trail">
        {activity.rows.length === 0 ? (
          <EmptyState title="No recorded activity for this user." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th width="80px">Method</Th>
                <Th>Path</Th>
                <Th align="right">Status</Th>
                <Th align="right">Duration</Th>
                <Th align="right">When</Th>
              </tr>
            </thead>
            <tbody>
              {activity.rows.map((a) => (
                <Tr key={a.id}>
                  <Td mono className="text-ink-3">
                    {a.method}
                  </Td>
                  <Td mono>{a.path}</Td>
                  <Td align="right">
                    <Badge tone={a.statusCode < 400 ? 'ok' : a.statusCode < 500 ? 'warn' : 'danger'}>
                      {a.statusCode}
                    </Badge>
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {a.durationMs}ms
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {dateTime(a.createdAt)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
    </>
  );
}
