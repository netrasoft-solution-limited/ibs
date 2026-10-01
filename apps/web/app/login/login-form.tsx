'use client';

import { useActionState } from 'react';

import { loginAction, type LoginState } from '../actions';
import { Button, Field, Input } from '@/components/ui';

export function LoginForm({ accounts }: { accounts: Array<{ email: string; description: string }> }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <>
      <form action={formAction} className="mt-7 space-y-4">
        <Field label="Email address">
          <Input
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="you@nsirs.gov.ng"
          />
        </Field>

        <Field label="Password">
          <Input name="password" type="password" autoComplete="current-password" required />
        </Field>

        {state.error ? (
          <p role="alert" className="rounded-[var(--radius-inner)] bg-danger-bg px-4 py-2.5 text-[12.5px] text-danger">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" variant="primary" disabled={pending} className="w-full">
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      {/* Working credentials. Hidden when NEXT_PUBLIC_SHOW_DEMO_LOGINS=false,
          in which case the panel disappears rather than rendering empty. */}
      {accounts.length === 0 ? null : (
      <div className="mt-7 rounded-[var(--radius-card)] bg-sunk p-4">
        <p className="eyebrow">Development sign-in · password “demo”</p>
        <ul className="mt-2.5 space-y-1">
          {accounts.map(({ email, description }) => (
            <li key={email} className="rounded-full px-3 py-2 transition-colors hover:bg-raised">
              <button
                type="button"
                onClick={() => {
                  const form = document.querySelector('form');
                  const e = form?.querySelector<HTMLInputElement>('input[name="email"]');
                  const p = form?.querySelector<HTMLInputElement>('input[name="password"]');
                  if (e && p) {
                    e.value = email;
                    p.value = 'demo';
                    e.focus();
                  }
                }}
                className="w-full text-left"
              >
                <span className="block text-[12px] font-medium text-[var(--tenant-accent)]">{email}</span>
                <span className="block text-[11.5px] text-ink-3">{description}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      )}
    </>
  );
}
