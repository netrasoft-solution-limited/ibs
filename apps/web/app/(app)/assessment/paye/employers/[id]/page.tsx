import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getEmployer, listPayroll, listRemittances } from '@/lib/api';
import { requirePermission } from '@/lib/session';
import { date, humanise, money, moneyShort, number, percent } from '@/lib/format';
import {
  Badge,
  Card,
  DefList,
  EmptyState,
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
  const employer = await getEmployer(id);
  return { title: employer ? employer.name : 'Employer' };
}

export default async function EmployerPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('assessment.paye');
  const { id } = await params;

  const employer = await getEmployer(id);
  if (!employer) notFound();

  const [payroll, remittances] = await Promise.all([listPayroll(employer.id), listRemittances(employer.id)]);

  const outstanding = remittances
    .filter((r) => r.status !== 'PAID')
    .reduce((s, r) => s + (r.amountDue - r.amountPaid), 0);
  const remitted = remittances.reduce((s, r) => s + r.amountPaid, 0);
  const exempt = payroll.filter((p) => p.paye.exempt).length;
  const sampled = payroll.length < employer.staffCount;

  return (
    <>
      <PageHeader
        eyebrow={`${humanise(employer.sector)} sector employer · ${employer.lgaName}`}
        title={employer.name}
        description="The roster, what each employee owes under the statutory bands, and whether the employer has remitted it."
      />

      <TileRow cols={5}>
        <StatTile
          label="Monthly PAYE due"
          value={money(employer.monthlyPayeDue)}
          sub="Computed from the roster"
          tone="accent"
        />
        <StatTile
          label="Outstanding remittance"
          value={moneyShort(outstanding)}
          sub={`${number(employer.monthsOutstanding)} months unsettled`}
          tone={outstanding > 0 ? 'danger' : 'default'}
        />
        <StatTile label="Remitted to date" value={moneyShort(remitted)} sub={`${remittances.length} periods`} />
        <StatTile label="Staff" value={number(employer.staffCount)} sub={`${number(exempt)} below the threshold`} />
        <StatTile label="Annual payroll" value={moneyShort(employer.annualGrossPayroll)} sub="Gross, all staff" />
      </TileRow>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <h2 className="text-[16px] font-semibold">Employer</h2>
          <Card className="mt-4">
            <DefList
              rows={[
                ['Employer TIN', <span key="t" className="tabular">{employer.tin}</span>],
                ['Sector', humanise(employer.sector)],
                ['Local government area', employer.lgaName],
                ['Email', employer.email],
                ['Phone', <span key="p" className="tabular">{employer.phone}</span>],
                ['Registered', date(employer.registeredAt)],
                [
                  'Status',
                  employer.isActive ? <Badge key="s" tone="ok">Active</Badge> : <Badge key="s" tone="neutral">Inactive</Badge>,
                ],
              ]}
            />
          </Card>

          <Card className="mt-4 bg-warn-bg/60">
            <p className="eyebrow">Not yet wired</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">
              Bulk payroll upload — a whole roster onboarded from one spreadsheet — lands with the API.
              The computation below already runs against whatever the roster holds.
            </p>
          </Card>
        </div>

        <div>
          <h2 className="text-[16px] font-semibold">Remittance console</h2>
          {remittances.length === 0 ? (
            <EmptyState title="No remittance period has opened for this employer." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Period</Th>
                  <Th align="right">Due</Th>
                  <Th align="right">Amount due</Th>
                  <Th align="right">Remitted</Th>
                  <Th align="right">Shortfall</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {remittances.map((r) => {
                  const shortfall = r.amountDue - r.amountPaid;
                  return (
                    <Tr key={r.id}>
                      <Td mono>{r.period}</Td>
                      <Td align="right" mono className="text-ink-3">
                        {date(r.dueDate)}
                      </Td>
                      <Td align="right" mono>
                        {money(r.amountDue)}
                      </Td>
                      <Td align="right" mono className="text-ink-3">
                        {money(r.amountPaid)}
                      </Td>
                      <Td align="right" mono className={shortfall > 0 ? 'text-danger' : 'text-ink-3'}>
                        {money(shortfall)}
                      </Td>
                      <Td>
                        <StatusBadge status={r.status} />
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </div>
      </div>

      <Section
        title="Payroll"
        hint={
          sampled
            ? `${number(payroll.length)} of ${number(employer.staffCount)} staff shown`
            : `${number(payroll.length)} staff`
        }
      >
        <Table>
          <thead>
            <tr>
              <Th>Staff number</Th>
              <Th>Employee</Th>
              <Th align="right">Annual gross</Th>
              <Th>Deductions</Th>
              <Th align="right">Chargeable</Th>
              <Th align="right">Annual PAYE</Th>
              <Th align="right">Monthly</Th>
              <Th align="right">Effective</Th>
            </tr>
          </thead>
          <tbody>
            {payroll.map((p) => (
              <Tr key={p.id}>
                <Td mono className="text-ink-3">
                  {p.staffNumber}
                </Td>
                <Td>{p.name}</Td>
                <Td align="right" mono>
                  {money(p.annualGross)}
                </Td>
                <Td>
                  <span className="flex flex-wrap gap-1">
                    {p.nhf ? <Badge>NHF</Badge> : null}
                    {p.pension ? <Badge>Pension</Badge> : null}
                    {p.nhis ? <Badge>NHIS</Badge> : null}
                  </span>
                </Td>
                <Td align="right" mono className="text-ink-3">
                  {money(p.paye.chargeableIncome)}
                </Td>
                <Td align="right" mono>
                  {p.paye.exempt ? <span className="text-ink-3">Exempt</span> : money(p.paye.annualTaxPayable)}
                </Td>
                <Td align="right" mono>
                  {p.paye.exempt ? '—' : money(p.paye.monthlyTaxPayable)}
                </Td>
                <Td align="right" mono className="text-ink-3">
                  {p.paye.exempt ? '—' : percent(p.paye.effectiveRate, 1)}
                </Td>
              </Tr>
            ))}
            <tr>
              <td colSpan={5} className="border-t border-rule-2 px-3 pt-3 text-right text-[13.5px] font-medium">
                Total for the roster shown
              </td>
              <td className="tabular border-t border-rule-2 px-3 pt-3 text-right text-[14px] font-medium">
                {money(payroll.reduce((s, p) => s + p.paye.annualTaxPayable, 0))}
              </td>
              <td className="tabular border-t border-rule-2 px-3 pt-3 text-right text-[14px] font-medium">
                {money(payroll.reduce((s, p) => s + p.paye.monthlyTaxPayable, 0))}
              </td>
              <td className="border-t border-rule-2" />
            </tr>
          </tbody>
        </Table>

        <p className="mt-3 max-w-[78ch] text-[12px] leading-relaxed text-ink-3">
          Every figure in this table is produced by <span className="font-mono">computePaye</span> in{' '}
          <span className="font-mono">@igr/tax-rules</span> at the moment the page renders — the same
          function the calculator uses and the same one the API will use to raise the bill. Nothing here
          is a stored liability, so an employee whose salary changes is reassessed correctly by definition.
        </p>
      </Section>
    </>
  );
}
