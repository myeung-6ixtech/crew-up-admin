import { createServerClient } from '@nhost/nhost-js';
import { NextResponse, type NextRequest } from 'next/server';
import { getAdminRoleFromSession, REMEMBER_COOKIE, sessionCookieOptions } from '@/lib/auth/session';
import { env } from '@/lib/env';
import { NHOST_SESSION_KEY, parseStoredSession } from '@/lib/nhost-cookie-storage';

const PUBLIC_PATHS = ['/login', '/delete-account'];

function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(NHOST_SESSION_KEY);
  response.cookies.delete(REMEMBER_COOKIE);
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  loginUrl.searchParams.set('reason', 'session_expired');
  const response = NextResponse.redirect(loginUrl);
  clearSessionCookie(response);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isApi = pathname.startsWith('/api/');

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const nhost = createServerClient({
    subdomain: env.NEXT_PUBLIC_NHOST_SUBDOMAIN,
    region: env.NEXT_PUBLIC_NHOST_REGION,
    authUrl: env.NEXT_PUBLIC_NHOST_AUTH_URL,
    graphqlUrl: env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
    storageUrl: env.NEXT_PUBLIC_NHOST_STORAGE_URL,
    functionsUrl: env.NEXT_PUBLIC_NHOST_FUNCTIONS_URL,
    storage: {
      get: () => parseStoredSession(request.cookies.get(NHOST_SESSION_KEY)?.value),
      set: (value) => {
        response.cookies.set(
          NHOST_SESSION_KEY,
          JSON.stringify(value),
          sessionCookieOptions(request.cookies.get(REMEMBER_COOKIE)?.value),
        );
      },
      remove: () => {
        clearSessionCookie(response);
      },
    },
  });

  if (isPublic) {
    if (pathname === '/login') {
      const session = await nhost.refreshSession();
      const adminRole = getAdminRoleFromSession(session);
      if (adminRole) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return response;
  }

  const session = await nhost.refreshSession();
  const adminRole = getAdminRoleFromSession(session);

  if (!adminRole) {
    if (isApi) {
      const unauthorized = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      clearSessionCookie(unauthorized);
      return unauthorized;
    }
    return redirectToLogin(request, pathname);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
