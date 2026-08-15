import {
  CookieStorage,
  DEFAULT_SESSION_KEY,
  type SessionStorageBackend,
  type StoredSession,
} from '@nhost/nhost-js/session';

export const NHOST_SESSION_KEY = DEFAULT_SESSION_KEY;

export function createCookieStorage(options?: {
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}): SessionStorageBackend {
  return new CookieStorage({
    cookieName: NHOST_SESSION_KEY,
    secure: options?.secure ?? process.env.NODE_ENV === 'production',
    sameSite: options?.sameSite ?? 'strict',
  });
}

export function parseStoredSession(raw: string | undefined | null): StoredSession | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}
