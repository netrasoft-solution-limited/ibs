import type { Metadata } from 'next';
import Link from 'next/link';

import { listMdas, listRevenueHeads } from '@/lib/api';
import { humanise, money, number } from '@/lib/format';
import {
  Badge,
  Button,
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

export const metadata: Metadata = { title: 'Revenue heads' };

export default async function RevenueHeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requirePermission('revenuehead.view');
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const approved = sp.approved === 'yes' ? true : sp.approved === 'no' ? false : undefined;

  const [result, mdas, all] = await Promise.all([
    listRevenueHeads({ q: sp.q, mdaId: sp.mdaId, approved, page }, user),
    listMdas(user),
    listRevenueHeads({ pageSize: 1000 }, user),
  ]);

  const pendingApproval = all.rows.filter((h) => !h.isApproved).length;

  const qs = new URLSearchParams(
    Object.entries(sp).filter(([k, v]) => v && k !== 'page') as [string, string][],
  );
  const baseHref = `/revenue-heads${qs.toString() ? `?${qs}` : ''}`;

  return (
    <>
      <PageHeader
        eyebrow="Revenue administration"
        title="Revenue heads and rates"
        description="The Service's approved chart of revenue. Each head carries its own amount, billing frequency and owning agency — and is not billable until it has been approved."
        actions={
          user.permissions.includes('revenuehead.manage') ? (
            <Button variant="primary">Add revenue head</Button>
          ) : null
        }
      />

      <TileRow cols={4}>
        <StatTile label="Revenue heads" value={number(all.total)} sub="All agencies" />
        <StatTile
          label="Approved and billable"
          value={number(all.total - pendingApproval)}
          tone="accent"
        />
        <StatTile
          label="Awaiting approval"
          value={number(pendingApproval)}
          sub="Cannot be billed against"
          tone={pendingApproval ? 'danger' : 'default'}
        />
        <StatTile label="Owning agencies" value={number(mdas.length)} />
      </TileRow>

      <form method="get" className="mt-5 grid gap-3 rounded-[var(--radius-card)] bg-sunk p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Field label="Search">
            <Input name="q" defaultValue={sp.q ?? ''} placeholder="Head name or item code" />
          </Field>
        </div>
        <Field label="Agency">
          <Select name="mdaId" defaultValue={sp.mdaId ?? ''}>
            <option value="">All agencies</option>
            {mdas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Approval">
          <Select name="approved" defaultValue={sp.approved ?? ''}>
            <option value="">Any</option>
            <option value="yes">Approved</option>
            <option value="no">Awaiting approval</option>
          </Select>
        </Field>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="rounded-full bg-deep px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-ink"
          >
            Apply filters
          </button>
          <Link href="/revenue-heads" className="px-2 text-[13px] text-ink-3 hover:text-[var(--tenant-accent)]">
            Reset
          </Link>
        </div>
      </form>

      {result.total === 0 ? (
        <EmptyState title="No revenue head matches those filters." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Item code</Th>
                <Th>Revenue head</Th>
                <Th>Agency</Th>
                <Th>Applies to</Th>
                <Th>Frequency</Th>
                <Th align="right">Amount</Th>
                <Th>Approval</Th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((h) => (
                <Tr key={h.id}>
                  <Td mono>{h.itemCode}</Td>
                  <Td>{h.itemName}</Td>
                  <Td>
                    <span className="text-[12.5px] text-ink-2">{h.mdaName}</span>
                  </Td>
                  <Td>
                    <span className="text-[12.5px] text-ink-2">{humanise(h.category)}</span>
                  </Td>
                  <Td>
                    <span className="text-[12.5px] text-ink-2">{humanise(h.frequency)}</span>
                  </Td>
                  <Td align="right" mono>
                    {h.amount > 0 ? (
                      money(h.amount)
                    ) : (
                      <span className="text-ink-3" title="Amount is computed by the rules engine">
                        assessed
                      </span>
                    )}
                  </Td>
                  <Td>
                    {h.isApproved ? (
                      <Badge tone="ok">Approved</Badge>
                    ) : user.permissions.includes('revenuehead.approve') ? (
                      <Button size="sm" variant="primary">
                        Approve
                      </Button>
                    ) : (
                      <Badge tone="warn">Pending</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} baseHref={baseHref} />
        </>
      )}

      <p className="mt-5 max-w-[70ch] text-[12px] leading-relaxed text-ink-3">
        Heads shown as <span className="font-mono">assessed</span> carry no fixed amount — PAYE, direct
        assessment, presumptive tax and withholding are computed from the statutory rules in{' '}
        <span className="font-mono">@igr/tax-rules</span> at the moment a bill is raised, so the same
        income produces the same assessment whoever raises it.
      </p>
    </>
  );
}
