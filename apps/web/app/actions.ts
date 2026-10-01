'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { SESSION_COOKIE, authenticate } from '@/lib/session';
import { landingRoute } from '@/components/nav';

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const user = authenticate(email, password);
  if (!user) {
    // Deliberately does not say which of the two was wrong.
    return { error: 'Those credentials were not accepted.' };
  }
  if (!user.isActive) {
    return { error: 'This account is deactivated. Contact your administrator.' };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  redirect(user.type === 'TAXPAYER' ? '/portal' : landingRoute(user.permissions));
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect('/login');
}
