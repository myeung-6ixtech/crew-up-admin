import { APP_CONSTANTS, POSTGRES_ENUMS } from '@/lib/constants/app-taxonomies';
import { getEventTagUsage } from '@/lib/data/airlines';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';

export default async function VariablesTaxonomyPage() {
  const tagUsage = await getEventTagUsage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Variables inventory</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Read-only view of enums and app constants. Changing these requires a code change or migration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Postgres enums</CardTitle>
          <CardDescription>Backed by database enum types.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(POSTGRES_ENUMS).map(([name, values]) => (
            <div key={name}>
              <div className="mb-2 text-sm font-medium">{name}</div>
              <div className="flex flex-wrap gap-2">
                {values.map((value) => (
                  <Badge key={value}>{value}</Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App constants (mobile)</CardTitle>
          <CardDescription>Hardcoded in crew-up-app/constants/.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 text-sm font-medium">EVENT_TAGS</div>
            <div className="flex flex-wrap gap-2">
              {APP_CONSTANTS.eventTags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">ROLE_TYPES</div>
            <div className="flex flex-wrap gap-2">
              {APP_CONSTANTS.roleTypes.map((value) => (
                <Badge key={value}>{value}</Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">VISIBILITY_LEVELS</div>
            <div className="flex flex-wrap gap-2">
              {APP_CONSTANTS.visibilityLevels.map((value) => (
                <Badge key={value}>{value}</Badge>
              ))}
            </div>
          </div>
          <div className="text-sm text-zinc-600">
            Airports: {APP_CONSTANTS.airportCount} static entries in crew-up-app/constants/airports.ts
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live event tag usage</CardTitle>
          <CardDescription>
            Tags actually used in events.tags, including free-text tags not in EVENT_TAGS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Tag</TH>
                <TH>Events</TH>
                <TH>In app constants?</TH>
              </TR>
            </THead>
            <TBody>
              {tagUsage.map((entry) => (
                <TR key={entry.tag}>
                  <TD>{entry.tag}</TD>
                  <TD>{entry.count}</TD>
                  <TD>
                    {APP_CONSTANTS.eventTags.includes(entry.tag as (typeof APP_CONSTANTS.eventTags)[number]) ? (
                      <Badge variant="success">Yes</Badge>
                    ) : (
                      <Badge variant="warning">No</Badge>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
