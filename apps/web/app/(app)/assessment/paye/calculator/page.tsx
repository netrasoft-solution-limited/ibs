import type { Metadata } from 'next';

import { PayeCalculator } from './paye-calculator';
import { PageHeader } from '@/components/ui';
import { requirePermission } from '@/lib/session';

export const metadata: Metadata = { title: 'PAYE assessment' };

export default async function PayePage() {
  await requirePermission('assessment.paye');
  return (
    <>
      <PageHeader
        eyebrow="Assessment · PAYE"
        title="PAYE calculator"
        description="Progressive bands from 7% to 24%, consolidated relief, and statutory housing, pension and health deductions. The working is shown in full because an assessment a taxpayer cannot follow is an assessment they will dispute."
      />
      <PayeCalculator />
    </>
  );
}
