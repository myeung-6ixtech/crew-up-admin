import { NextResponse, type NextRequest } from 'next/server';
import { NHOST_SESSION_KEY, parseStoredSession } from '@/lib/nhost-cookie-storage';

const HASURA_CLAIMS_KEY = 'https://hasura.io/jwt/claims';
const PUBLIC_PATHS = ['/login'];

function hasAdminRole(session: ReturnType<typeof parseStoredSession>): boolean {
  if (!session?.decodedToken) return false;
  const claims = session.decodedToken[HASURA_CLAIMS_KEY] as
    | Record<string, string | string[]>
    | undefined;
  const allowedRoles = Array.isArray(claims?.['x-hasura-allowed-roles'])
    ? claims['x-hasura-allowed-roles']
    : typeof claims?.['x-hasura-allowed-roles'] === 'string'
      ? [claims['x-hasura-allowed-roles']]
      : [];
  return allowedRoles.includes('staff_admin') || allowedRoles.includes('moderator');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isApi = pathname.startsWith('/api/');
  const session = parseStoredSession(request.cookies.get(NHOST_SESSION_KEY)?.value);
  const isAdmin = hasAdminRole(session);

  if (isPublic) {
    if (isAdmin && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!isAdmin) {
    if (isApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
