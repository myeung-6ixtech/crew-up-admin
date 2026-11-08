'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  Flag,
  Images,
  Plane,
  Settings,
  ShieldBan,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type NavChild = { href: string; label: string };

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: BarChart3 },
  { href: '/users', label: 'Users', icon: Users },
  {
    href: '/events',
    label: 'Events',
    icon: Calendar,
    children: [
      { href: '/events/analytics', label: 'Analytics' },
      { href: '/events/events-list', label: 'Events list' },
    ],
  },
  { href: '/reports', label: 'Reports', icon: Flag },
  { href: '/moderation/terms', label: 'Blocked words', icon: ShieldBan },
  { href: '/taxonomy', label: 'Taxonomy', icon: Plane },
  { href: '/admin-management', label: 'Admin management', icon: ShieldCheck },
  { href: '/media', label: 'Media library', icon: Images },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function isItemActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

function isChildActive(pathname: string, href: string) {
  if (href === '/events/events-list') {
    return (
      pathname === href ||
      pathname.startsWith('/events/create') ||
      pathname.startsWith('/events/edit')
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map(({ href, label, icon: Icon, children }) => {
          if (children) {
            const sectionActive = isItemActive(pathname, href);
            return (
              <div key={href} className="space-y-1">
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                    sectionActive ? 'text-zinc-900' : 'text-zinc-700',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
                <div className="space-y-1 pl-7">
                  {children.map((child) => {
                    const active = isChildActive(pathname, child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          active ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100',
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          const active = isItemActive(pathname, href);
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
