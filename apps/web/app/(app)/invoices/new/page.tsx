import type { Metadata } from 'next';

import { RaiseInvoiceForm } from './raise-form';
import { getTaxpayer, listRevenueHeads } from '@/lib/api';
import { PageHeader } from '@/components/ui';
import { requirePermission } from '@/lib/session';

export const metadata: Metadata = { title: 'Raise invoice' };

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('invoice.create');
  const sp = await searchParams;
  const [heads, taxpayer] = await Promise.all([
    listRevenueHeads({ approved: true, pageSize: 1000 }),
    sp.taxpayerId ? getTaxpayer(sp.taxpayerId) : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Billing"
        title="Raise an invoice"
        description="A bill may carry several revenue heads at once. Where their billing frequencies differ, the earliest due date governs the whole bill — a rule the platform applies, not the officer."
      />
      <RaiseInvoiceForm heads={heads.rows} taxpayer={taxpayer} />
    </>
  );
}
