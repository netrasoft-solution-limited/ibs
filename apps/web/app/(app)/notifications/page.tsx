import type { Metadata } from 'next';

import { listNotificationTemplates } from '@/lib/api';
import { requirePermission } from '@/lib/session';
import { number } from '@/lib/format';
import { Badge, Card, PageHeader, Section, StatTile, Table, Td, Th, TileRow, Tr } from '@/components/ui';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  await requirePermission('content.manage');
  const templates = await listNotificationTemplates();

  const enabled = templates.filter((t) => t.enabled);
  const sent = templates.reduce((s, t) => s + t.sentThisMonth, 0);
  const email = templates.filter((t) => t.channel === 'EMAIL').length;

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Notifications"
        description="Automated notices covering registration, verification, invoicing, payment, TIN outcome and every clearance stage — issued under the Service's own sending identity, not a shared one."
      />

      <TileRow cols={4}>
        <StatTile label="Templates" value={number(templates.length)} sub={`${email} email · ${templates.length - email} SMS`} />
        <StatTile label="Enabled" value={number(enabled.length)} tone="accent" />
        <StatTile
          label="Disabled"
          value={number(templates.length - enabled.length)}
          sub="Will not send"
          tone={templates.length - enabled.length ? 'danger' : 'default'}
        />
        <StatTile label="Sent this month" value={number(sent)} sub="Across all templates" />
      </TileRow>

      <Section title="Templates" hint="What fires, and when">
        <Table>
          <thead>
            <tr>
              <Th>Notice</Th>
              <Th>Key</Th>
              <Th>Fires when</Th>
              <Th>Channel</Th>
              <Th>State</Th>
              <Th align="right">Sent this month</Th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <Tr key={t.id}>
                <Td>
                  <span className="font-medium">{t.name}</span>
                </Td>
                <Td mono className="text-ink-3">
                  {t.key}
                </Td>
                <Td>
                  <span className="text-[12.5px] text-ink-2">{t.trigger}</span>
                </Td>
                <Td>
                  <Badge tone={t.channel === 'EMAIL' ? 'info' : 'neutral'}>{t.channel}</Badge>
                </Td>
                <Td>{t.enabled ? <Badge tone="ok">Enabled</Badge> : <Badge tone="danger">Disabled</Badge>}</Td>
                <Td align="right" mono>
                  {number(t.sentThisMonth)}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Section>

      <Card className="mt-6 bg-warn-bg/60">
        <p className="text-[12.5px] leading-relaxed text-ink-2">
          Delivery credits are not included in the platform price — email and SMS are billed on usage and
          settled by the Service. A disabled template sends nothing and records nothing.
        </p>
      </Card>
    </>
  );
}
