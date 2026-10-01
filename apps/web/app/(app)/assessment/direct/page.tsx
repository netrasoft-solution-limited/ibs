import type { Metadata } from 'next';

import { DirectAssessmentForm } from './direct-form';
import { requirePermission } from '@/lib/session';
import { PageHeader } from '@/components/ui';

export const metadata: Metadata = { title: 'Direct assessment' };

export default async function DirectAssessmentPage() {
  await requirePermission('assessment.direct');

  return (
    <>
      <PageHeader
        eyebrow="Assessment"
        title="Direct assessment"
        description="For income that is not taxed through an employer's payroll. The full salary composition is captured, and the same statutory bands apply — a self-employed taxpayer and a salaried one on identical income owe identical tax."
      />
      <DirectAssessmentForm />
    </>
  );
}
