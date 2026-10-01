/**
 * Session handling for the development build.
 *
 * This is a signed-cookie stand-in that holds only a user id; the real thing
 * is a JWT issued by `apps/api` and verified there on every request. It exists
 * so the shell, the navigation and the permission gating can be built and
 * demonstrated before the API lands.
 *
 * It is deliberately NOT a security boundary. Every permission check here is a
 * courtesy to the user — the server must refuse the operation independently.
 */

import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { allUsers } from './mock/data';
import type { User } from './types';

export const SESSION_COOKIE = 'igr_session';

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const user = allUsers.find((u) => u.id === id);
  if (!user) return null;

  // Deactivation takes effect on the next request, not at the next sign-in.
  // Checking this only in `authenticate` left a deactivated officer working
  // normally until their cookie happened to expire.
  return user.isActive ? user : null;
}

/**
 * Sends an unauthenticated visitor to sign in.
 *
 * Redirects rather than throws: the layout and the page render concurrently,
 * so a throw here surfaces as an uncaught error even when the layout's own
 * redirect is what ends up being served.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function hasPermission(key: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.permissions.includes(key) ?? false;
}

/**
 * Guards a screen on a single permission.
 *
 * Called explicitly at the top of every protected page rather than centrally,
 * because a route the sidebar happens not to link is still a route someone can
 * type. Filtering the navigation is a courtesy; this is the refusal. It is
 * still not the security boundary — when `apps/api` lands it refuses the same
 * operation independently, and that check is the one that counts.
 */
export async function requirePermission(key: string): Promise<User> {
  const user = await requireUser();
  if (!user.permissions.includes(key)) {
    redirect(`/forbidden?required=${encodeURIComponent(key)}`);
  }
  return user;
}

/** Credentials accepted in development: any seeded user, password "demo". */
export function authenticate(email: string, password: string): User | null {
  if (password !== 'demo') return null;
  return allUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
}
