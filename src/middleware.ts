import { NextRequest, NextResponse } from 'next/server';

const BLOQUIM_LOGIN = 'https://bloquim.beeads.com.br/login';

/**
 * Lightweight JWT presence check in middleware (Edge Runtime).
 * Full signature verification happens in server components via jsonwebtoken.
 * The middleware only ensures the cookie exists so unauth users are redirected
 * before any data-fetching server component runs.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets and the login page itself
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  const token =
    req.cookies.get('__beeads_session')?.value ??
    req.cookies.get('token')?.value;

  if (!token) {
    const returnUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}${pathname}`;
    const loginRedirect = new URL(BLOQUIM_LOGIN);
    loginRedirect.searchParams.set('return_url', returnUrl);
    return NextResponse.redirect(loginRedirect);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
