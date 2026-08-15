'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Plane, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/', label: 'Dashboard', icon: BarChart3 },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/taxonomy', label: 'Taxonomy', icon: Plane },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar({
  displayName,
  role,
}: {
  displayName: string;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-6 py-5">
        <div className="text-lg font-semibold">CrewUp Admin</div>
        <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
          <span>{displayName}</span>
          <Badge>{role}</Badge>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
