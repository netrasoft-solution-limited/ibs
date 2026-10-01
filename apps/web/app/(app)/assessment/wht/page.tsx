import type { Metadata } from 'next';

import { WhtCalculator } from './wht-calculator';
import { PageHeader } from '@/components/ui';
import { requirePermission } from '@/lib/session';

export const metadata: Metadata = { title: 'Withholding tax' };

export default async function WhtPage() {
  await requirePermission('assessment.wht');
  return (
    <>
      <PageHeader
        eyebrow="Assessment"
        title="Withholding tax"
        description="Deduction at source across ten transaction categories, with the higher rate applied where the recipient is a company. Both parties are recorded on every deduction — the payer and the payee."
      />
      <WhtCalculator />
    </>
  );
}
