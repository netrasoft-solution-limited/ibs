import type { Metadata } from 'next';
import Link from 'next/link';

import { listPermissionCatalogue, listUsers } from '@/lib/api';
import { date, humanise, number } from '@/lib/format';
import {
  Badge,
  EmptyState,
  Field,
  Input,
  PageHeader,
  StatTile,
  Table,
  Td,
  Th,
  TileRow,
  Tr,
} from '@/components/ui';
import { requirePermission } from '@/lib/session';

export const metadata: Metadata = { title: 'Users & permissions' };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('user.view');
  const sp = await searchParams;
  const [users, catalogue] = await Promise.all([listUsers(sp.q ?? ''), listPermissionCatalogue()]);

  const byType = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.type] = (acc[u.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Users and permissions"
        description="One user table with a type discriminator, replacing five separate user tables and five parallel login paths. Permissions are granted individually, never inherited from a role name."
      />

      <TileRow cols={4}>
        <StatTile label="Users" value={number(users.length)} sub={`${number(users.filter((u) => u.isActive).length)} active`} />
        <StatTile label="Permissions in catalogue" value={number(catalogue.length)} sub="Enforced on the server" tone="accent" />
        <StatTile label="Administrators" value={number(byType.ADMIN ?? 0)} sub="Full catalogue granted" />
        <StatTile label="User types" value="5" sub="Admin, officer, agency, agent, taxpayer" />
      </TileRow>

      <form method="get" className="mt-5 flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] bg-sunk p-4">
        <div className="min-w-[260px] flex-1">
          <Field label="Search">
            <Input name="q" defaultValue={sp.q ?? ''} placeholder="Name, email or agency" />
          </Field>
        </div>
        <button
          type="submit"
          className="rounded-full bg-deep px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-ink"
        >
          Search
        </button>
        <Link href="/users" className="px-2 pb-1.5 text-[13px] text-ink-3 hover:text-[var(--tenant-accent)]">
          Reset
        </Link>
      </form>

      {users.length === 0 ? (
        <EmptyState title="No user matches that search." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>User</Th>
              <Th>Type</Th>
              <Th>Scope</Th>
              <Th align="right">Permissions</Th>
              <Th align="right">Last signed in</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <Link href={`/users/${u.id}`} className="font-medium hover:text-[var(--tenant-accent)]">
                    {u.fullName}
                  </Link>
                  <span className="block text-[11.5px] text-ink-3">{u.email}</span>
                </Td>
                <Td>
                  <span className="text-[12.5px] text-ink-2">{humanise(u.type)}</span>
                </Td>
                <Td>
                  <span className="text-[12.5px] text-ink-3">{u.mdaName ?? 'State-wide'}</span>
                </Td>
                <Td align="right" mono>
                  {number(u.permissions.length)}
                  <span className="text-ink-3"> / {catalogue.length}</span>
                </Td>
                <Td align="right" mono className="text-ink-3">
                  {date(u.lastLoginAt)}
                </Td>
                <Td>{u.isActive ? <Badge tone="ok">Active</Badge> : <Badge tone="neutral">Deactivated</Badge>}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <p className="mt-5 max-w-[74ch] text-[12px] leading-relaxed text-ink-3">
        Hiding a screen from a user is a courtesy, not a control. Every permission in this catalogue is
        checked again on the server for each request, so a user who reaches a URL they were not shown is
        still refused.
      </p>
    </>
  );
}
