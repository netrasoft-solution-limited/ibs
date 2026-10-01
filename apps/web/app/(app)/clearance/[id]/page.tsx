import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getTaxpayer, getTccApplication } from '@/lib/api';
import { requirePermission } from '@/lib/session';
import { date, dateTime, humanise, money, number } from '@/lib/format';
import { STAGE_ROLE, TccChain, stageIndex } from '@/components/tcc-chain';
import {
  Badge,
  Button,
  Card,
  LinkButton,
  DefList,
  PageHeader,
  Section,
  StatTile,
  TileRow,
} from '@/components/ui';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const app = await getTccApplication(id);
  return { title: app ? app.certificateNumber : 'Clearance application' };
}

export default async function ClearanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('tcc.review.first');
  const { id } = await params;

  const app = await getTccApplication(id);
  if (!app) notFound();

  const taxpayer = await getTaxpayer(app.taxpayerId);
  const settled = app.stage === 'ISSUED' || app.stage === 'DECLINED';

  // A reviewer may act only at the stage their role owns, and only when the
  // fee has settled. Both conditions are shown rather than silently disabling.
  const requiredKey = STAGE_ROLE[app.stage];
  const isMyStage = Boolean(requiredKey && user.permissions.includes(requiredKey));

  return (
    <>
      <PageHeader
        eyebrow={`Clearance · ${app.yearOfAssessment} year of assessment`}
        title={app.certificateNumber}
        description={`Applied ${date(app.appliedAt)} by ${app.taxpayerName}.`}
        actions={
          <>
            <Link
              href={`/taxpayers/${app.taxpayerId}`}
              className="rounded-full bg-raised px-4 py-2 text-[13.5px] font-medium text-ink-2 shadow-soft transition-colors hover:text-ink"
            >
              Taxpayer record
            </Link>
            {!settled && isMyStage && app.feePaid ? (
              <>
                <Button variant="secondary">Decline</Button>
                <Button variant="primary">
                  {app.stage === 'DIRECTOR_REVIEW' ? 'Issue certificate' : 'Approve and advance'}
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <Section title="Review chain" hint={`Stage ${Math.max(1, stageIndex(app.stage) + 1)} of 6`}>
        <Card className="mt-4">
          <TccChain stage={app.stage} />

          <div className="mt-5 border-t border-rule pt-4">
            {settled ? (
              <p className="text-[13px] text-ink-2">
                {app.stage === 'ISSUED'
                  ? `Certificate issued ${date(app.issuedAt)} and valid until ${date(app.expiresAt)}.`
                  : 'This application was declined and returned to the applicant. The record and the reason remain on file, and the applicant may correct and resubmit.'}
              </p>
            ) : !app.feePaid ? (
              <p className="text-[13px] text-danger">
                The application fee has not settled. The chain does not advance until it does.
              </p>
            ) : isMyStage ? (
              <p className="text-[13px] text-ink-2">
                This application is at <span className="font-medium">your</span> stage. Approving advances
                it to the next reviewer; declining ends the chain and notifies the applicant.
              </p>
            ) : (
              <p className="text-[13px] text-ink-2">
                Waiting on the reviewer who holds{' '}
                <span className="font-medium">{requiredKey}</span>. A stage belongs to exactly one role,
                so two officers cannot act on the same application at once.
              </p>
            )}
          </div>
        </Card>
      </Section>

      <TileRow cols={4}>
        <StatTile
          label="Stage"
          value={humanise(app.stage)}
          tone={app.stage === 'DECLINED' ? 'danger' : app.stage === 'ISSUED' ? 'default' : 'accent'}
        />
        <StatTile label="Application fee" value={app.feePaid ? 'Settled' : 'Outstanding'} sub={app.feeInvoiceNumber} />
        <StatTile
          label="Taxpayer liability"
          value={money(taxpayer?.outstandingAmount)}
          sub={
            (taxpayer?.outstandingAmount ?? 0) > 0
              ? 'Outstanding — grounds to decline'
              : 'Nothing outstanding'
          }
        />
        <StatTile
          label="Validity"
          value={app.expiresAt ? date(app.expiresAt) : '—'}
          sub={app.issuedAt ? `Issued ${date(app.issuedAt)}` : 'Not yet issued'}
        />
      </TileRow>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <h2 className="text-[16px] font-semibold">Applicant</h2>
          <Card className="mt-4">
            <DefList
              rows={[
                ['Name', app.taxpayerName],
                ['TIN', <span key="t" className="tabular">{app.taxpayerTin}</span>],
                ['Category', taxpayer ? humanise(taxpayer.category) : '—'],
                ['Area', taxpayer?.lgaName ?? '—'],
                ['Email', taxpayer?.email ?? '—'],
                ['Bills on record', number(taxpayer?.invoiceCount)],
                [
                  'Outstanding',
                  <span key="o" className={(taxpayer?.outstandingAmount ?? 0) > 0 ? 'text-danger' : ''}>
                    {money(taxpayer?.outstandingAmount)}
                  </span>,
                ],
              ]}
            />
          </Card>
        </div>

        <div>
          <h2 className="text-[16px] font-semibold">What each reviewer did</h2>
          <Card className="mt-4">
            <ol>
              {app.history.map((e, i) => (
                <li key={`${e.stage}-${i}`} className="flex gap-3 border-b border-rule py-3 last:border-b-0">
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      e.stage === 'DECLINED' ? 'bg-danger' : 'bg-[var(--tenant-accent)]'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[13px] font-medium">{humanise(e.stage)}</span>
                      <span className="tabular text-[11.5px] text-ink-3">{dateTime(e.actedAt)}</span>
                    </div>
                    <p className="text-[12px] text-ink-3">{e.actorName}</p>
                    {e.remark ? <p className="mt-1 text-[12.5px] text-ink-2">{e.remark}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
            Every stage records the officer who acted, when, and on what remark. A certificate that cannot
            say who issued it is a certificate the Service cannot defend.
          </p>
        </div>
      </div>

      {app.stage === 'ISSUED' ? (
        <Section title="Certificate" hint="QR coded for third-party checks">
          <Card className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Verifiable at</p>
              <p className="mt-1 text-[14px] font-medium">
                pay.nasarawa.gov.ng/verify · {app.certificateNumber}
              </p>
              <p className="mt-1 text-[12px] text-ink-3">
                Anyone asked to accept this certificate can confirm it without an account.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="ok">Valid until {date(app.expiresAt)}</Badge>
              <LinkButton href={`/print/certificate/${app.certificateNumber}`} variant="primary" size="sm">
                Print certificate
              </LinkButton>
            </div>
          </Card>
        </Section>
      ) : null}
    </>
  );
}
