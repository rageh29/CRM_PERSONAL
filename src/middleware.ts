import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  const isPublicPage = pathname === '/login' || pathname === '/register';
  const isApiRoute = pathname.startsWith('/api');
  const isPublicAsset = pathname.startsWith('/_next') || pathname.startsWith('/favicon');

  // Allow API routes and public assets
  if (isApiRoute || isPublicAsset) return NextResponse.next();

  // Redirect logged-in users away from login/register pages to dashboard
  if (isPublicPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Redirect unauthenticated users trying to access protected pages to /register
  if (!isPublicPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/register', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
