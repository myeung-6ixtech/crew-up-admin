'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { nhostBrowser } from '@/lib/nhost-client';
import { clearRemember, rememberFor48Hours } from '@/lib/nhost-cookie-storage';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sessionExpired = searchParams.get('reason') === 'session_expired';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (remember) rememberFor48Hours();
    else clearRemember();

    try {
      const result = await nhostBrowser.auth.signInEmailPassword({ email, password });
      if (!result.body.session) {
        clearRemember();
        setError('Sign in failed. Check your credentials and admin role assignment.');
        setLoading(false);
        return;
      }
    } catch (err) {
      clearRemember();
      setError(err instanceof Error ? err.message : 'Sign in failed');
      setLoading(false);
      return;
    }

    const next = searchParams.get('next') || '/';
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="w-full max-w-[400px] space-y-6">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white">
          CU
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Welcome back</h1>
        <p className="text-sm text-zinc-500">Sign in to the CrewUp admin dashboard</p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {sessionExpired ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Your session expired. Sign in again to continue.
            </p>
          ) : null}
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@airline.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
            />
            Remember for the next 48 hours
          </label>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-zinc-500">Staff admin and moderator accounts only.</p>
    </div>
  );
}
