import 'server-only';

import { graphqlAsAdmin } from '@/lib/data/graphql';
import type { AirlineInput } from '@/lib/schemas/airline.schema';
import type { Airline } from '@/lib/types/airline';

export type { Airline };

const LIST_AIRLINES_QUERY = `
  query ListAirlines {
    airlines(order_by: { name: asc }) {
      id
      code
      name
      email_domains
      is_active
      created_at
      updated_at
    }
  }
`;

const GET_AIRLINE_QUERY = `
  query GetAirline($id: uuid!) {
    airlines_by_pk(id: $id) {
      id
      code
      name
      email_domains
      is_active
      created_at
      updated_at
    }
  }
`;

export async function getAirlines(): Promise<Airline[]> {
  const data = await graphqlAsAdmin<{ airlines: Airline[] }>(LIST_AIRLINES_QUERY);
  return data.airlines;
}

export async function getAirlineById(id: string): Promise<Airline | null> {
  const data = await graphqlAsAdmin<{ airlines_by_pk: Airline | null }>(GET_AIRLINE_QUERY, { id });
  return data.airlines_by_pk;
}

export async function createAirline(input: AirlineInput, actorId: string) {
  const data = await graphqlAsAdmin<{ insert_airlines_one: Airline | null }>(
    `
      mutation CreateAirline($object: airlines_insert_input!) {
        insert_airlines_one(object: $object) {
          id
          code
          name
          email_domains
          is_active
        }
      }
    `,
    {
      object: {
        code: input.code.toUpperCase(),
        name: input.name,
        email_domains: input.email_domains,
        is_active: input.is_active,
      },
    },
  );

  console.info(
    JSON.stringify({
      event: 'admin.airline.created',
      actorId,
      airlineId: data.insert_airlines_one?.id,
      code: input.code,
      at: new Date().toISOString(),
    }),
  );

  return data.insert_airlines_one;
}

export async function updateAirline(id: string, input: AirlineInput, actorId: string) {
  const data = await graphqlAsAdmin<{ update_airlines_by_pk: Airline | null }>(
    `
      mutation UpdateAirline($id: uuid!, $set: airlines_set_input!) {
        update_airlines_by_pk(pk_columns: { id: $id }, _set: $set) {
          id
          code
          name
          email_domains
          is_active
        }
      }
    `,
    {
      id,
      set: {
        code: input.code.toUpperCase(),
        name: input.name,
        email_domains: input.email_domains,
        is_active: input.is_active,
      },
    },
  );

  console.info(
    JSON.stringify({
      event: 'admin.airline.updated',
      actorId,
      airlineId: id,
      at: new Date().toISOString(),
    }),
  );

  return data.update_airlines_by_pk;
}

export async function getEventTagUsage(): Promise<Array<{ tag: string; count: number }>> {
  const data = await graphqlAsAdmin<{ events: Array<{ tags: string[] }> }>(
    `
      query EventTags {
        events {
          tags
        }
      }
    `,
  );

  const counts = new Map<string, number>();
  for (const event of data.events) {
    for (const tag of event.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
