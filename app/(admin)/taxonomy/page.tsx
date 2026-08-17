import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Plane, Variable } from 'lucide-react';

const taxonomySections = [
  {
    href: '/taxonomy/airlines',
    title: 'Airlines',
    description: 'Carrier codes, names, and email domains for verification.',
    icon: Plane,
  },
  {
    href: '/taxonomy/activities',
    title: 'Activities',
    description: 'Activity types for events and user layover preferences.',
    icon: Calendar,
  },
  {
    href: '/taxonomy/variables',
    title: 'Variables',
    description: 'Read-only inventory of Postgres enums and app constants.',
    icon: Variable,
  },
];

export default function TaxonomyIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Taxonomy</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage reference data and review system variables.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {taxonomySections.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="transition-colors hover:border-zinc-300 hover:bg-zinc-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <CardTitle>{title}</CardTitle>
                </div>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-zinc-600">Open list →</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
