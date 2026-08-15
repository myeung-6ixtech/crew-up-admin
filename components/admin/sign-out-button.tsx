'use client';

import { nhostBrowser } from '@/lib/nhost-client';
import { Button } from '@/components/ui/button';

export function SignOutButton() {
  async function handleSignOut() {
    await nhostBrowser.auth.signOut({});
    window.location.href = '/login';
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}
