import { NextResponse } from 'next/server';

const PROTECTED_PATHS = ['/checkout', '/orders', '/settings', '/wishlist'];

export function proxy(request) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));

  if (isProtected) {
    const sessionCookie = request.cookies.get('JSESSIONID');
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/checkout/:path*', '/orders/:path*', '/settings/:path*', '/wishlist/:path*'],
};
