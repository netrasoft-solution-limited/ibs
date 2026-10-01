import type { Metadata } from 'next';

import { RegisterTaxpayerForm } from './register-form';
import { listLgas } from '@/lib/api';
import { PageHeader } from '@/components/ui';
import { requirePermission } from '@/lib/session';

export const metadata: Metadata = { title: 'Register taxpayer' };

export default async function NewTaxpayerPage() {
  await requirePermission('taxpayer.create');
  const lgas = await listLgas();

  return (
    <>
      <PageHeader
        eyebrow="Taxpayers"
        title="Register a taxpayer"
        description="Individuals, corporates and agencies are captured through one guided form. The identifier is derived from the year and the local government area, and duplicates are refused on email and phone."
      />
      <RegisterTaxpayerForm lgas={lgas} />
    </>
  );
}
