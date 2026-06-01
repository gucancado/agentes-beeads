import 'server-only';
import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error('JWT_SECRET env var is required');

export interface AuthUser {
  userId: string;
  email: string;
}

interface JwtPayload {
  userId?: string;
  sub?: string;
  email: string;
  iat?: number;
  exp?: number;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get('__beeads_session')?.value ?? cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as JwtPayload;
    const userId = payload.userId ?? payload.sub;
    if (!userId) return null;
    return { userId, email: payload.email };
  } catch {
    return null;
  }
}

export async function getRawCookieHeader(): Promise<string> {
  const h = await headers();
  return h.get('cookie') ?? '';
}

export function loginUrl(currentUrl: string): string {
  const u = new URL('https://bloquim.beeads.com.br/login');
  u.searchParams.set('return_url', currentUrl);
  return u.toString();
}

export async function getCurrentUrl(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'agentes.beeads.com.br';
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const pathname = h.get('x-pathname') ?? '/';
  const ALLOWED_HOST = /^([a-z0-9-]+\.)*beeads\.com\.br$/;
  const safeHost = ALLOWED_HOST.test(host) ? host : 'agentes.beeads.com.br';
  const safeProto = safeHost === 'agentes.beeads.com.br' ? 'https' : proto;
  return `${safeProto}://${safeHost}${pathname}`;
}

/** Compat export: mirrors the shape returned by NextAuth's auth() */
export async function auth() {
  const u = await getAuthUser();
  if (!u) return null;
  return { user: { id: u.userId, email: u.email } };
}

/**
 * Server Action helper: redirect to Bloquim login (clears session cookie).
 * Used by Topbar to implement "sair →".
 */
export async function logoutRedirectUrl(): Promise<string> {
  return 'https://bloquim.beeads.com.br/login';
}
