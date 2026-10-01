import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getFiling, getTaxpayer } from '@/lib/api';
import { requirePermission } from '@/lib/session';
import { date, humanise, money, number } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  DefList,
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const filing = await getFiling(id);
  return { title: filing ? filing.filingReference : 'Filing' };
}

export default async function FilingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('filing.review');
  const { id } = await params;

  const filing = await getFiling(id);
  if (!filing) notFound();

  const taxpayer = await getTaxpayer(filing.taxpayerId);
  const declared = filing.lines.reduce((s, l) => s + l.declaredAmount, 0);
  const assessed = filing.lines.reduce((s, l) => s + (l.assessedAmount ?? l.declaredAmount), 0);
  const open = filing.status === 'SUBMITTED' || filing.status === 'UNDER_REVIEW';

  return (
    <>
      <PageHeader
        eyebrow={`Filing · ${filing.period}`}
        title={filing.filingReference}
        description={`Declared by ${filing.taxpayerName} on ${date(filing.submittedAt)}.`}
        actions={
          <Link
            href={`/taxpayers/${filing.taxpayerId}`}
            className="rounded-full bg-raised px-4 py-2 text-[13.5px] font-medium text-ink-2 shadow-soft transition-colors hover:text-ink"
          >
            Taxpayer record
          </Link>
        }
      />

      <TileRow cols={4}>
        <StatTile label="Status" value={humanise(filing.status)} tone={open ? 'accent' : 'default'} />
        <StatTile label="Declared" value={money(declared)} sub={`${number(filing.lines.length)} tax types`} />
        <StatTile
          label="Assessed"
          value={money(assessed)}
          sub={assessed > declared ? `${money(assessed - declared)} above declaration` : 'As declared'}
          tone={assessed > declared ? 'danger' : 'default'}
        />
        <StatTile label="Documents" value={number(filing.documents.length)} sub="Attached in support" />
      </TileRow>

      <Section title="Declared tax types" hint="Each decided on its own">
        <Table>
          <thead>
            <tr>
              <Th>Tax type</Th>
              <Th align="right">Declared</Th>
              <Th align="right">Assessed</Th>
              <Th>Decision</Th>
              <Th>Remark</Th>
              <Th align="right" />
            </tr>
          </thead>
          <tbody>
            {filing.lines.map((l) => (
              <Tr key={l.id}>
                <Td>{l.taxType}</Td>
                <Td align="right" mono>
                  {money(l.declaredAmount)}
                </Td>
                <Td align="right" mono className={l.assessedAmount && l.assessedAmount > l.declaredAmount ? 'text-danger' : 'text-ink-3'}>
                  {l.assessedAmount ? money(l.assessedAmount) : '—'}
                </Td>
                <Td>
                  {l.decision === 'APPROVED' ? (
                    <Badge tone="ok">Approved</Badge>
                  ) : l.decision === 'REJECTED' ? (
                    <Badge tone="danger">Rejected</Badge>
                  ) : (
                    <Badge tone="warn">Pending</Badge>
                  )}
                </Td>
                <Td>
                  <span className="text-[12.5px] leading-snug text-ink-3">{l.remark ?? '—'}</span>
                </Td>
                <Td align="right">
                  {l.decision === 'PENDING' ? (
                    <span className="flex justify-end gap-1.5">
                      <Button size="sm">Reject</Button>
                      <Button size="sm" variant="primary">
                        Approve
                      </Button>
                    </span>
                  ) : null}
                </Td>
              </Tr>
            ))}
            <tr>
              <td className="border-t border-rule-2 px-3 pt-3 text-right text-[13.5px] font-medium">Total</td>
              <td className="tabular border-t border-rule-2 px-3 pt-3 text-right text-[14px] font-medium">
                {money(declared)}
              </td>
              <td className="tabular border-t border-rule-2 px-3 pt-3 text-right text-[14px] font-medium">
                {money(assessed)}
              </td>
              <td className="border-t border-rule-2" colSpan={3} />
            </tr>
          </tbody>
        </Table>
      </Section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[16px] font-semibold">Supporting documents</h2>
          <Card className="mt-4">
            {filing.documents.map((d) => (
              <div
                key={d.name}
                className="flex items-center justify-between gap-4 border-b border-rule py-2.5 last:border-b-0"
              >
                <span className="truncate text-[13px]">{d.name}</span>
                <span className="tabular shrink-0 text-[12px] text-ink-3">
                  {(d.sizeKb / 1024).toFixed(1)} MB
                </span>
              </div>
            ))}
          </Card>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
            Document reading (capability 26) extracts the figures from these and flags where an attachment
            contradicts the declaration, so the officer checks a difference rather than a document.
          </p>
        </div>

        <div>
          <h2 className="text-[16px] font-semibold">Filed by</h2>
          <Card className="mt-4">
            <DefList
              rows={[
                ['Taxpayer', filing.taxpayerName],
                ['TIN', <span key="t" className="tabular">{filing.taxpayerTin}</span>],
                ['Category', taxpayer ? humanise(taxpayer.category) : '—'],
                ['Area', taxpayer?.lgaName ?? '—'],
                ['Period', filing.period],
                ['Submitted', date(filing.submittedAt)],
                ['Filing status', <StatusBadge key="s" status={filing.status} />],
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
