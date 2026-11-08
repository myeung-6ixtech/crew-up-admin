import { DEFAULT_SESSION_KEY, type SessionStorageBackend, type StoredSession } from '@nhost/nhost-js/session';
import { REMEMBER_COOKIE, REMEMBER_FOR_MS } from '@/lib/auth/session';

export const NHOST_SESSION_KEY = DEFAULT_SESSION_KEY;

function cookieFlags() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `; path=/; SameSite=strict${secure}`;
}

function readCookie(name: string): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const separator = cookie.indexOf('=');
    if (separator === -1) continue;
    const key = cookie.slice(0, separator).trim();
    if (key !== name) continue;
    return decodeURIComponent(cookie.slice(separator + 1).trim());
  }
  return null;
}

function rememberUntil(): number | null {
  const raw = readCookie(REMEMBER_COOKIE);
  const until = Number(raw);
  if (!Number.isFinite(until) || until <= Date.now()) return null;
  return until;
}

/** Keeps the admin signed in until 48 hours after this login. Call before sign-in. */
export function rememberFor48Hours() {
  const until = Date.now() + REMEMBER_FOR_MS;
  document.cookie = `${REMEMBER_COOKIE}=${until}; expires=${new Date(until).toUTCString()}${cookieFlags()}`;
}

export function clearRemember() {
  document.cookie = `${REMEMBER_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC${cookieFlags()}`;
}

export function createCookieStorage(): SessionStorageBackend {
  const storage: SessionStorageBackend = {
    get() {
      const raw = readCookie(NHOST_SESSION_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as StoredSession;
      } catch {
        storage.remove();
        return null;
      }
    },
    set(value) {
      const until = rememberUntil();
      const expires = until ? `; expires=${new Date(until).toUTCString()}` : '';
      const encoded = encodeURIComponent(JSON.stringify(value));
      document.cookie = `${NHOST_SESSION_KEY}=${encoded}${expires}${cookieFlags()}`;
    },
    remove() {
      document.cookie = `${NHOST_SESSION_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC${cookieFlags()}`;
      clearRemember();
    },
  };
  return storage;
}

export function parseStoredSession(raw: string | undefined | null): StoredSession | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}
