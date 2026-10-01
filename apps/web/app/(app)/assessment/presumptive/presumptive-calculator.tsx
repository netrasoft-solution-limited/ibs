'use client';

import { useMemo, useState } from 'react';

import {
  OutsidePresumptiveRangeError,
  PRESUMPTIVE_BANDS,
  PRESUMPTIVE_MAX_STAFF,
  computePresumptive,
} from '@igr/tax-rules';
import { Badge, Card, Field, Input, Select, StatTile, Table, Td, Th, TileRow, Tr } from '@/components/ui';
import { humanise, money } from '@/lib/format';
import type { PresumptiveSchedule } from '@/lib/types';

export function PresumptiveCalculator({ schedules }: { schedules: PresumptiveSchedule[] }) {
  const [businessType, setBusinessType] = useState(schedules[0]?.businessType ?? '');
  const [staffCount, setStaffCount] = useState(7);

  const schedule = schedules.find((s) => s.businessType === businessType) ?? schedules[0];

  // The rules engine refuses a business outside the range rather than banding
  // it silently, so the screen has to be able to render that refusal.
  const outcome = useMemo(() => {
    if (!schedule) return null;
    try {
      return {
        ok: true as const,
        result: computePresumptive(staffCount, {
          micro: schedule.micro,
          small: schedule.small,
          medium: schedule.medium,
          frequency: schedule.frequency,
        }),
      };
    } catch (error) {
      if (error instanceof OutsidePresumptiveRangeError) {
        return { ok: false as const, message: error.message };
      }
      throw error;
    }
  }, [schedule, staffCount]);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
      <div>
        <div>
          <h2 className="text-[16px] font-semibold">Business</h2>
        </div>
        <Card className="mt-4 space-y-4">
          <Field label="Business type" hint="Amounts are set per type by the Service.">
            <Select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
              {schedules.map((s) => (
                <option key={s.id} value={s.businessType}>
                  {s.businessType}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Number of employees" hint={`Presumptive assessment applies from 1 to ${PRESUMPTIVE_MAX_STAFF} staff.`}>
            <Input
              type="number"
              min={0}
              max={200}
              value={staffCount}
              onChange={(e) => setStaffCount(Math.max(0, Number(e.target.value)))}
            />
          </Field>
        </Card>

        <div className="mt-6">
          <h2 className="text-[16px] font-semibold">The bands</h2>
        </div>
        <Card className="mt-4">
          {PRESUMPTIVE_BANDS.map((b) => {
            const active = outcome?.ok && outcome.result.category === b.category;
            return (
              <div
                key={b.category}
                className={`flex items-baseline justify-between gap-3 border-b border-rule py-2.5 last:border-b-0 ${
                  active ? 'font-medium text-[var(--tenant-accent)]' : 'text-ink-2'
                }`}
              >
                <span className="text-[13px]">
                  {humanise(b.category)}
                  {active ? <span className="ml-2"><Badge tone="ok">Applies</Badge></span> : null}
                </span>
                <span className="tabular text-[12.5px]">{b.label}</span>
              </div>
            );
          })}
        </Card>
      </div>

      <div>
        <div>
          <h2 className="text-[16px] font-semibold">Assessment</h2>
        </div>

        {outcome?.ok ? (
          <>
            <TileRow cols={3}>
              <StatTile label="Amount payable" value={money(outcome.result.payableAmount)} tone="accent" />
              <StatTile label="Band" value={humanise(outcome.result.category)} sub={`${outcome.result.staffCount} employees`} />
              <StatTile label="Frequency" value={humanise(outcome.result.frequency)} />
            </TileRow>

            <div className="mt-6">
              <h2 className="text-[16px] font-semibold">Schedule for {schedule?.businessType}</h2>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Band</Th>
                  <Th>Staff strength</Th>
                  <Th align="right">Amount</Th>
                </tr>
              </thead>
              <tbody>
                {PRESUMPTIVE_BANDS.map((b) => {
                  const amount = schedule ? schedule[b.category] : 0;
                  const active = outcome.result.category === b.category;
                  return (
                    <Tr key={b.category}>
                      <Td className={active ? 'font-medium text-[var(--tenant-accent)]' : ''}>
                        {humanise(b.category)}
                      </Td>
                      <Td>
                        <span className="text-[12.5px] text-ink-2">{b.label}</span>
                      </Td>
                      <Td align="right" mono className={active ? 'font-medium text-[var(--tenant-accent)]' : ''}>
                        {money(amount)}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </>
        ) : (
          <Card className="mt-4 bg-danger-bg">
            <h3 className="text-[15px] text-danger">Outside presumptive assessment</h3>
            <p className="mt-1.5 max-w-[62ch] text-[13.5px] leading-relaxed text-ink-2">
              {outcome?.message ?? 'A staff count is required.'}
            </p>
            <p className="mt-3 max-w-[62ch] text-[12px] leading-relaxed text-ink-3">
              The rules engine raises this rather than returning a figure. A business assessed on the wrong
              instrument is a dispute waiting to happen, so the refusal is deliberate.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
