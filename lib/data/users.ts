import 'server-only';

import { graphqlAsAdmin } from '@/lib/data/graphql';
import type { CustomerProfileInput } from '@/lib/schemas/customer-profile.schema';

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  disabled: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastSeen: string | null;
  profile: {
    display_name: string;
    full_name?: string | null;
    full_name_native?: string | null;
    preferred_name?: string | null;
    username?: string | null;
    is_verified: boolean;
    role_type: string | null;
    crew_role?: string | null;
    rank?: string | null;
    avatar_file_id?: string | null;
    base_airport?: string | null;
    base_airport_iata?: string | null;
    airline_id?: string | null;
    airline: { id: string; code: string; name: string } | null;
  } | null;
  roles: Array<{ id: string; role: string; createdAt: string }>;
};

const LIST_USERS_QUERY = `
  query ListUsers($limit: Int!, $offset: Int!, $where: users_bool_exp!) {
    users(
      limit: $limit
      offset: $offset
      order_by: { createdAt: desc }
      where: $where
    ) {
      id
      email
      displayName
      disabled
      emailVerified
      createdAt
      lastSeen
      profile {
        display_name
        is_verified
        role_type
        airline { id code name }
      }
      roles { id role createdAt }
    }
    usersAggregate(where: $where) {
      aggregate { count }
    }
  }
`;

const GET_USER_QUERY = `
  query GetUser($id: uuid!) {
    user(id: $id) {
      id
      email
      displayName
      disabled
      emailVerified
      createdAt
      lastSeen
      defaultRole
      profile {
        display_name
        full_name
        full_name_native
        preferred_name
        username
        is_verified
        role_type
        crew_role
        rank
        avatar_file_id
        base_airport
        base_airport_iata
        airline_id
        airline { id code name }
      }
      roles { id role createdAt }
    }
  }
`;

type ListUsersResponse = {
  users: AdminUser[];
  usersAggregate: { aggregate: { count: number } | null };
};

type GetUserResponse = {
  user: AdminUser & { defaultRole: string | null; roles: Array<{ id: string; role: string; createdAt: string }> };
};

/** `app` is everyone who cannot sign in here. `staff` is moderator and staff_admin. */
export type UserAudience = 'app' | 'staff';

const STAFF_ROLES = ['moderator', 'staff_admin'];

export async function getUsers(options?: {
  search?: string;
  limit?: number;
  offset?: number;
  audience?: UserAudience;
}): Promise<{ users: AdminUser[]; total: number }> {
  const search = options?.search?.trim();
  const pattern = search ? `%${search}%` : '%';
  const searchFilter = {
    _or: [{ email: { _ilike: pattern } }, { displayName: { _ilike: pattern } }],
  };
  const staffRoleFilter = { roles: { role: { _in: STAFF_ROLES } } };
  const where =
    options?.audience === 'staff'
      ? { _and: [searchFilter, staffRoleFilter] }
      : options?.audience === 'app'
        ? { _and: [searchFilter, { _not: staffRoleFilter }] }
        : searchFilter;
  const data = await graphqlAsAdmin<ListUsersResponse>(LIST_USERS_QUERY, {
    limit: options?.limit ?? 25,
    offset: options?.offset ?? 0,
    where,
  });

  return {
    users: data.users,
    total: data.usersAggregate.aggregate?.count ?? 0,
  };
}

export async function getUserById(id: string) {
  const data = await graphqlAsAdmin<GetUserResponse>(GET_USER_QUERY, { id });
  return data.user;
}

const ROLE_TYPES = new Set(['cabin_crew', 'pilot', 'ground_ops']);

export async function updateCustomerProfile(userId: string, input: CustomerProfileInput, actorId: string) {
  const fullName = input.full_name || null;
  const preferredName = input.preferred_name || null;
  const airport = input.base_airport_iata || null;
  const crewRole = input.crew_role || null;
  const data = await graphqlAsAdmin<{ update_profiles_by_pk: { user_id: string } | null }>(
    `
      mutation UpdateCustomerProfile($id: uuid!, $set: profiles_set_input!) {
        update_profiles_by_pk(pk_columns: { user_id: $id }, _set: $set) {
          user_id
        }
      }
    `,
    {
      id: userId,
      set: {
        full_name: fullName,
        full_name_native: input.full_name_native || null,
        preferred_name: preferredName,
        display_name: preferredName || fullName || '',
        username: input.username || null,
        airline_id: input.airline_id || null,
        base_airport_iata: airport,
        base_airport: airport,
        crew_role: crewRole,
        role_type: crewRole && ROLE_TYPES.has(crewRole) ? crewRole : null,
        rank: input.rank || null,
        is_verified: input.is_verified,
      },
    },
  );

  console.info(
    JSON.stringify({
      event: 'admin.user.profile_overridden',
      actorId,
      userId,
      at: new Date().toISOString(),
    }),
  );

  return data.update_profiles_by_pk;
}

export async function setUserDisabled(userId: string, disabled: boolean, actorId: string) {
  const data = await graphqlAsAdmin<{ updateUser: { id: string; disabled: boolean } | null }>(
    `
      mutation SetUserDisabled($id: uuid!, $disabled: Boolean!) {
        updateUser(pk_columns: { id: $id }, _set: { disabled: $disabled }) {
          id
          disabled
        }
      }
    `,
    { id: userId, disabled },
  );

  console.info(
    JSON.stringify({
      event: 'admin.user.disabled_changed',
      actorId,
      userId,
      disabled,
      at: new Date().toISOString(),
    }),
  );

  return data.updateUser;
}

export async function grantRole(userId: string, role: 'moderator' | 'staff_admin', actorId: string) {
  const data = await graphqlAsAdmin<{ insertAuthUserRole: { id: string; role: string } | null }>(
    `
      mutation GrantRole($userId: uuid!, $role: String!) {
        insertAuthUserRole(object: { userId: $userId, role: $role }) {
          id
          role
        }
      }
    `,
    { userId, role },
  );

  console.info(
    JSON.stringify({
      event: 'admin.role.granted',
      actorId,
      userId,
      role,
      at: new Date().toISOString(),
    }),
  );

  return data.insertAuthUserRole;
}

export async function revokeRole(roleId: string, actorId: string, userId: string, role: string) {
  const data = await graphqlAsAdmin<{ deleteAuthUserRole: { id: string } | null }>(
    `
      mutation RevokeRole($id: uuid!) {
        deleteAuthUserRole(id: $id) {
          id
        }
      }
    `,
    { id: roleId },
  );

  console.info(
    JSON.stringify({
      event: 'admin.role.revoked',
      actorId,
      userId,
      role,
      at: new Date().toISOString(),
    }),
  );

  return data.deleteAuthUserRole;
}
