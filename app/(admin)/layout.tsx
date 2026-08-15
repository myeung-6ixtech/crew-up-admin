import { getAuthSession } from '@/lib/data/auth';
import { AdminSidebar } from '@/components/admin/sidebar';
import { SignOutButton } from '@/components/admin/sign-out-button';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session) {
    return children;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <AdminSidebar displayName={session.displayName} role={session.role} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
          <div className="text-sm text-zinc-500">Internal admin dashboard</div>
          <SignOutButton />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
