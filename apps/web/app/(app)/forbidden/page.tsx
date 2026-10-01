import type { Metadata } from 'next';
import Link from 'next/link';

import { PERMISSIONS } from '@/lib/permissions';
import { requireUser } from '@/lib/session';
import { Card, PageHeader } from '@/components/ui';

export const metadata: Metadata = { title: 'Not permitted' };

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireUser();
  const required = PERMISSIONS.find((p) => p.key === sp.required);

  return (
    <>
      <PageHeader
        eyebrow="403"
        title="You do not hold the permission for that screen"
        description="Your account reached a page it is not granted. Nothing was shown, and the attempt is on the audit trail."
      />

      <Card className="mt-6 max-w-[64ch] border-l-2 border-l-danger">
        <p className="eyebrow">Permission required</p>
        <p className="mt-2 font-mono text-[14px] text-danger">{sp.required ?? 'unknown'}</p>
        {required ? (
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
            <span className="font-medium">{required.label}</span> — {required.description}
          </p>
        ) : null}

        <p className="mt-4 text-[13px] leading-relaxed text-ink-3">
          Signed in as {user.fullName}. If this permission is part of your duties, an administrator can
          grant it individually — permissions are never inherited from a role name.
        </p>

        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-full bg-raised px-4 py-2 text-[13px] text-ink-2 shadow-soft transition-colors hover:text-ink"
        >
          Back to where you were permitted
        </Link>
      </Card>
    </>
  );
}
