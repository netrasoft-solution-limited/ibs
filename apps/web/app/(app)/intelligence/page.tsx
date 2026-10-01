import type { Metadata } from 'next';
import Link from 'next/link';

import { listRecoveryLeads, listRegisterGaps, listRiskLeads } from '@/lib/api';
import { dateTime, humanise, money, moneyShort, number } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
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

export const metadata: Metadata = { title: 'Compliance intelligence' };

function scoreTone(score: number) {
  if (score >= 70) return 'danger' as const;
  if (score >= 45) return 'warn' as const;
  return 'neutral' as const;
}

export default async function IntelligencePage() {
  const user = await requirePermission('intelligence.view');
  const [risk, recovery, gaps] = await Promise.all([
    listRiskLeads(25),
    listRecoveryLeads(25),
    listRegisterGaps(20),
  ]);

  const recoverable = recovery.reduce((s, r) => s + r.amount, 0);
  const atRisk = risk.reduce((s, r) => s + r.outstanding, 0);

  return (
    <>
      <PageHeader
        eyebrow="Compliance intelligence"
        title="Where the recoverable revenue is"
        description="Ranked worklists built from data the Service already holds. Nothing here computes a liability — these screens find and rank cases, the rules engine computes the amount, and a named officer approves it."
      />

      <TileRow cols={4}>
        <StatTile label="Cases ranked" value={number(risk.length)} sub="By recoverable amount" />
        <StatTile label="Liability at risk" value={moneyShort(atRisk)} tone="danger" />
        <StatTile
          label="Interrupted payments"
          value={number(recovery.length)}
          sub="Taxpayers who tried and failed"
        />
        <StatTile label="Recoverable now" value={moneyShort(recoverable)} tone="accent" />
      </TileRow>

      <Card className="mt-6 bg-warn-bg/60">
        <h3 className="text-[15px]">What these lists are, and what they are not</h3>
        <p className="mt-1.5 max-w-[78ch] text-[13px] leading-relaxed text-ink-2">
          Every score below carries its reasons, because a demand notice raised off an unexplained number
          is one that loses on appeal. No figure on this page is an assessment: the amounts shown are
          balances already computed by the statutory rules and posted to the register. The intelligence
          layer decides only <em>whose case an officer should open first</em>.
        </p>
      </Card>

      <Section title="Payment recovery" hint="Capability 25 · settlement interrupted">
        <p className="mt-3 max-w-[78ch] text-[13px] leading-relaxed text-ink-2">
          These taxpayers reached the payment step and the settlement did not complete. They had already
          decided to pay, which makes them the cheapest revenue on this page to collect.
        </p>
        {recovery.length === 0 ? (
          <EmptyState title="No interrupted settlements outstanding." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Taxpayer</Th>
                <Th>Invoice</Th>
                <Th>Channel</Th>
                <Th align="right">Attempts</Th>
                <Th align="right">Last attempt</Th>
                <Th align="right">Recoverable</Th>
              </tr>
            </thead>
            <tbody>
              {recovery.map((r) => (
                <Tr key={r.invoiceId}>
                  <Td>
                    <Link href={`/taxpayers/${r.taxpayerId}`} className="hover:text-[var(--tenant-accent)]">
                      {r.taxpayerName}
                    </Link>
                  </Td>
                  <Td mono>
                    <Link href={`/invoices/${r.invoiceId}`} className="hover:text-[var(--tenant-accent)]">
                      {r.invoiceNumber}
                    </Link>
                  </Td>
                  <Td>
                    <span className="text-[12.5px] text-ink-2">{humanise(r.channel)}</span>
                  </Td>
                  <Td align="right" mono>
                    {r.attempts}
                  </Td>
                  <Td align="right" mono className="text-ink-3">
                    {dateTime(r.lastAttempt)}
                  </Td>
                  <Td align="right" mono className="text-[var(--tenant-accent)]">
                    {money(r.amount)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section title="Compliance risk" hint="Capability 24 · ranked by recoverable amount">
        {risk.length === 0 ? (
          <EmptyState title="No taxpayer currently scores above the threshold." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th align="right" width="70px">Score</Th>
                <Th>Taxpayer</Th>
                <Th>Area</Th>
                <Th>Why this case is ranked here</Th>
                <Th align="right">Overdue</Th>
                <Th align="right">Outstanding</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {risk.map((r) => (
                <Tr key={r.taxpayerId}>
                  <Td align="right">
                    <Badge tone={scoreTone(r.score)}>{r.score}</Badge>
                  </Td>
                  <Td>
                    <Link href={`/taxpayers/${r.taxpayerId}`} className="hover:text-[var(--tenant-accent)]">
                      {r.name}
                    </Link>
                    <span className="tabular block text-[11.5px] text-ink-3">{r.tin}</span>
                  </Td>
                  <Td>
                    <span className="text-[12.5px] text-ink-2">{r.lgaName}</span>
                  </Td>
                  <Td>
                    <ul className="space-y-0.5">
                      {r.reasons.map((reason) => (
                        <li key={reason} className="text-[12px] leading-snug text-ink-3">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </Td>
                  <Td align="right" mono>
                    {r.overdueBills}
                  </Td>
                  <Td align="right" mono className="text-danger">
                    {money(r.outstanding)}
                  </Td>
                  <Td align="right">
                    {user.permissions.includes('intelligence.action') ? (
                      <Button size="sm" variant="primary">
                        Open case
                      </Button>
                    ) : null}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section title="Register gaps" hint="Capability 23 · contradictions inside the roll">
        <p className="mt-3 max-w-[78ch] text-[13px] leading-relaxed text-ink-2">
          Parties the platform is billing that it never fully admitted to the register. Each is either a
          record to complete or a bill that should not have been raised — both are worth knowing.
        </p>
        {gaps.length === 0 ? (
          <EmptyState title="The register holds no contradictions of this kind." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Taxpayer</Th>
                <Th>Issue</Th>
                <Th>Detail</Th>
                <Th align="right">Outstanding</Th>
              </tr>
            </thead>
            <tbody>
              {gaps.map((g) => (
                <Tr key={g.taxpayerId}>
                  <Td>
                    <Link href={`/taxpayers/${g.taxpayerId}`} className="hover:text-[var(--tenant-accent)]">
                      {g.name}
                    </Link>
                    <span className="tabular block text-[11.5px] text-ink-3">{g.tin}</span>
                  </Td>
                  <Td>
                    <Badge tone="warn">{g.issue}</Badge>
                  </Td>
                  <Td>
                    <span className="text-[12.5px] leading-snug text-ink-3">{g.detail}</span>
                  </Td>
                  <Td align="right" mono className={g.outstanding ? 'text-danger' : 'text-ink-3'}>
                    {money(g.outstanding)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <p className="mt-8 max-w-[78ch] text-[12px] leading-relaxed text-ink-3">
        Third-party matching (capability 22) reads the payer-and-payee pairs recorded on withholding
        filings to find payees who are absent from the roll or declaring less than counterparties reported
        paying them. It is not shown here because the development dataset carries no withholding filings
        yet; the deduction screen already records both parties, which is the input it needs.
      </p>
    </>
  );
}
