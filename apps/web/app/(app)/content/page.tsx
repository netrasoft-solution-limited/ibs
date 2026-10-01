import type { Metadata } from 'next';

import { listContentPages } from '@/lib/api';
import { requirePermission } from '@/lib/session';
import { date, number } from '@/lib/format';
import { Badge, Button, Card, PageHeader, Section, StatTile, Table, Td, Th, TileRow, Tr } from '@/components/ui';

export const metadata: Metadata = { title: 'Content' };

export default async function ContentPage() {
  await requirePermission('content.manage');
  const pages = await listContentPages();

  const published = pages.filter((p) => p.published).length;
  const sections = Array.from(new Set(pages.map((p) => p.section)));

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Public information"
        description="The guidance, help and library pages the Service publishes on its own site. Content is maintained by the Service itself — nothing here requires a developer or a deployment."
        actions={<Button variant="primary">New page</Button>}
      />

      <TileRow cols={4}>
        <StatTile label="Pages" value={number(pages.length)} sub={`${sections.length} sections`} />
        <StatTile label="Published" value={number(published)} tone="accent" sub="Visible on the public site" />
        <StatTile
          label="Draft"
          value={number(pages.length - published)}
          sub="Not yet visible"
          tone={pages.length - published ? 'danger' : 'default'}
        />
        <StatTile label="Sections" value={number(sections.length)} sub={sections.join(' · ')} />
      </TileRow>

      {sections.map((section) => (
        <Section key={section} title={section} hint={`${pages.filter((p) => p.section === section).length} pages`}>
          <Table>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Address</Th>
                <Th>State</Th>
                <Th>Last edited by</Th>
                <Th align="right">Updated</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {pages
                .filter((p) => p.section === section)
                .map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <span className="font-medium">{p.title}</span>
                    </Td>
                    <Td mono className="text-ink-3">
                      /{p.slug}
                    </Td>
                    <Td>
                      {p.published ? <Badge tone="ok">Published</Badge> : <Badge tone="warn">Draft</Badge>}
                    </Td>
                    <Td>
                      <span className="text-[12.5px] text-ink-2">{p.updatedByName}</span>
                    </Td>
                    <Td align="right" mono className="text-ink-3">
                      {date(p.updatedAt)}
                    </Td>
                    <Td align="right">
                      <Button size="sm">Edit</Button>
                    </Td>
                  </Tr>
                ))}
            </tbody>
          </Table>
        </Section>
      ))}

      <Card className="mt-6 bg-warn-bg/60">
        <p className="eyebrow">Not yet wired</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">
          Editing and publishing land with the API. The page list, sections and states are real.
        </p>
      </Card>
    </>
  );
}
