import type { Metadata } from 'next';
import Link from 'next/link';

import { listAuditLogs } from '@/lib/api';
import { dateTime, humanise, number } from '@/lib/format';
import {
  Badge,
  EmptyState,
  Field,
  Input,
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
import { requirePermission } from '@/lib/session';

export const metadata: Metadata = { title: 'Audit trail' };

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('audit.view');
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const [result, all] = await Promise.all([
    listAuditLogs({
      q: sp.q,
      outcome: sp.outcome as 'success' | 'denied' | 'error' | undefined,
      page,
    }),
    listAuditLogs({ pageSize: 10_000 }),
  ]);

  const denied = all.rows.filter((a) => a.statusCode === 401 || a.statusCode === 403).length;
  const actors = new Set(all.rows.map((a) => a.userId)).size;

  const qs = new URLSearchParams(
    Object.entries(sp).filter(([k, v]) => v && k !== 'page') as [string, string][],
  );
  const baseHref = `/audit${qs.toString() ? `?${qs}` : ''}`;

  return (
    <>
      <PageHeader
        eyebrow="Assurance"
        title="Audit trail"
        description="Every action recorded with the officer who took it, what was submitted, the outcome, the address and the device. Nothing happens on this platform that cannot afterwards be shown."
      />

      <TileRow cols={4}>
        <StatTile label="Actions recorded" value={number(all.total)} sub="Trailing 45 days" />
        <StatTile label="Named actors" value={number(actors)} sub="Attributed to a signed-in user" />
        <StatTile
          label="Refused"
          value={number(denied)}
          sub="401 and 403 responses"
          tone={denied ? 'danger' : 'default'}
        />
        <StatTile
          label="Success rate"
          value={`${Math.round(((all.total - denied) / Math.max(1, all.total)) * 100)}%`}
          tone="accent"
        />
      </TileRow>

      <form method="get" className="mt-5 grid gap-3 rounded-[var(--radius-card)] bg-sunk p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Field label="Search">
            <Input name="q" defaultValue={sp.q ?? ''} placeholder="Path, method, user or IP address" />
          </Field>
        </div>
        <Field label="Outcome">
          <Select name="outcome" defaultValue={sp.outcome ?? ''}>
            <option value="">Any outcome</option>
            <option value="success">Succeeded</option>
            <option value="denied">Refused (401/403)</option>
            <option value="error">Errored</option>
          </Select>
        </Field>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-full bg-deep px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-ink"
          >
            Apply
          </button>
          <Link href="/audit" className="px-2 pb-1.5 text-[13px] text-ink-3 hover:text-[var(--tenant-accent)]">
            Reset
          </Link>
        </div>
      </form>

      {result.total === 0 ? (
        <EmptyState title="No recorded action matches those filters." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th align="right">When</Th>
                <Th>Actor</Th>
                <Th width="70px">Method</Th>
                <Th>Path</Th>
                <Th align="right">Status</Th>
                <Th align="right">Duration</Th>
                <Th>Address</Th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((a) => (
                <Tr key={a.id}>
                  <Td align="right" mono className="text-ink-3">
                    {dateTime(a.createdAt)}
                  </Td>
                  <Td>
                    {a.userId ? (
                      <Link href={`/users/${a.userId}`} className="hover:text-[var(--tenant-accent)]">
                        {a.userName}
                      </Link>
                    ) : (
                      <span className="text-ink-3">Anonymous</span>
                    )}
                    <span className="block text-[11px] text-ink-3">
                      {a.userType ? humanise(a.userType) : '—'}
                    </span>
                  </Td>
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
                  <Td mono className="text-ink-3">
                    {a.ipAddress}
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
