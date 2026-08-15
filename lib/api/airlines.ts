import 'client-only';

import type { AirlineInput } from '@/lib/schemas/airline.schema';
import type { Airline } from '@/lib/types/airline';
import { nhostGraphqlRequest } from '@/lib/api/nhost-graphql';

function normalizeInput(input: AirlineInput) {
  return {
    code: input.code.toUpperCase(),
    name: input.name,
    email_domains: input.email_domains,
    is_active: input.is_active,
  };
}

export async function createAirlineViaApi(input: AirlineInput): Promise<Airline> {
  const data = await nhostGraphqlRequest<{ insert_airlines_one: Airline | null }>(
    `
      mutation CreateAirline($object: airlines_insert_input!) {
        insert_airlines_one(object: $object) {
          id
          code
          name
          email_domains
          is_active
          created_at
          updated_at
        }
      }
    `,
    { object: normalizeInput(input) },
  );

  if (!data.insert_airlines_one) {
    throw new Error('Failed to create airline');
  }

  return data.insert_airlines_one;
}

export async function updateAirlineViaApi(id: string, input: AirlineInput): Promise<Airline> {
  const data = await nhostGraphqlRequest<{ update_airlines_by_pk: Airline | null }>(
    `
      mutation UpdateAirline($id: uuid!, $set: airlines_set_input!) {
        update_airlines_by_pk(pk_columns: { id: $id }, _set: $set) {
          id
          code
          name
          email_domains
          is_active
          created_at
          updated_at
        }
      }
    `,
    { id, set: normalizeInput(input) },
  );

  if (!data.update_airlines_by_pk) {
    throw new Error('Failed to update airline');
  }

  return data.update_airlines_by_pk;
}
