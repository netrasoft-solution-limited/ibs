import type { Metadata } from 'next';

import { PresumptiveCalculator } from './presumptive-calculator';
import { listPresumptiveSchedules } from '@/lib/api';
import { PageHeader } from '@/components/ui';
import { requirePermission } from '@/lib/session';

export const metadata: Metadata = { title: 'Presumptive assessment' };

export default async function PresumptivePage() {
  await requirePermission('assessment.presumptive');
  const schedules = await listPresumptiveSchedules();

  return (
    <>
      <PageHeader
        eyebrow="Assessment"
        title="Presumptive tax"
        description="Small businesses assessed on staff strength rather than on declared books. The bands are policy; the amounts are the Service's own and are configured in reference data."
      />
      <PresumptiveCalculator schedules={schedules} />
    </>
  );
}
