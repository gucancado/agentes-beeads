import { auth } from '@/lib/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return;
  }

  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.nextUrl);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
