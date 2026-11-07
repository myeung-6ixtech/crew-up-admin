import 'server-only';

import { graphqlAsAdmin } from '@/lib/data/graphql';

export type BaseAirport = {
  iata: string;
  name: string;
  city: string | null;
  is_active: boolean;
};

export async function getBaseAirports(): Promise<BaseAirport[]> {
  const data = await graphqlAsAdmin<{ airports: BaseAirport[] }>(`
    query BaseAirports {
      airports(order_by: { iata: asc }) {
        iata
        name
        city
        is_active
      }
    }
  `);
  return data.airports;
}
