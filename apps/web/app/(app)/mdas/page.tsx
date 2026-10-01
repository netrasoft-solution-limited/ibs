import type { Metadata } from 'next';
import Link from 'next/link';

import { listMdas } from '@/lib/api';
import { money, moneyShort, number } from '@/lib/format';
import { Badge, Button, PageHeader, StatTile, Table, Td, Th, TileRow, Tr } from '@/components/ui';
import { requirePermission } from '@/lib/session';

export const metadata: Metadata = { title: 'Agencies' };

export default async function MdasPage() {
  const user = await requirePermission('mda.view');
  const mdas = await listMdas(user);
  const total = mdas.reduce((s, m) => s + (m.collectedYtd ?? 0), 0);
  const active = mdas.filter((m) => m.isActive).length;

  return (
    <>
      <PageHeader
        eyebrow="Revenue administration"
        title="Ministries, departments and agencies"
        description="The register of bodies collecting revenue on behalf of the state, each with its own revenue heads, its own portal users and its own collection performance."
        actions={
          user.permissions.includes('mda.manage') ? <Button variant="primary">Add agency</Button> : null
        }
      />

      <TileRow cols={4}>
        <StatTile label="Agencies registered" value={number(mdas.length)} sub={`${number(active)} active`} />
        <StatTile label="Collected year to date" value={moneyShort(total)} tone="accent" />
        <StatTile
          label="Best performing"
          value={mdas[0]?.code ?? '—'}
          sub={mdas[0] ? moneyShort(mdas[0].collectedYtd) : undefined}
        />
        <StatTile
          label="Revenue heads"
          value={number(mdas.reduce((s, m) => s + (m.revenueHeadCount ?? 0), 0))}
          sub="Across all agencies"
        />
      </TileRow>

      <Table>
        <thead>
          <tr>
            <Th>Agency</Th>
            <Th>Code</Th>
            <Th>Contact</Th>
            <Th align="right">Revenue heads</Th>
            <Th align="right">Collected YTD</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {mdas.map((m) => (
            <Tr key={m.id}>
              <Td>
                <Link
                  href={`/revenue-heads?mdaId=${m.id}`}
                  className="font-medium hover:text-[var(--tenant-accent)]"
                >
                  {m.name}
                </Link>
              </Td>
              <Td mono>{m.code}</Td>
              <Td>
                <span className="block text-[12px] text-ink-3">{m.email}</span>
                <span className="tabular block text-[12px] text-ink-3">{m.phone}</span>
              </Td>
              <Td align="right" mono>
                {number(m.revenueHeadCount)}
              </Td>
              <Td align="right" mono>
                {money(m.collectedYtd)}
              </Td>
              <Td>
                {m.isActive ? <Badge tone="ok">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
                {m.allowPayment ? null : (
                  <span className="ml-1.5">
                    <Badge tone="warn">No payment</Badge>
                  </span>
                )}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
