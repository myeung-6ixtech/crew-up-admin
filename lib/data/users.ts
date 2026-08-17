import 'server-only';

import { graphqlAsAdmin } from '@/lib/data/graphql';

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
    is_verified: boolean;
    role_type: string | null;
    airline: { id: string; code: string; name: string } | null;
  } | null;
  roles: Array<{ id: string; role: string; createdAt: string }>;
};

const LIST_USERS_QUERY = `
  query ListUsers($limit: Int!, $offset: Int!, $search: String!) {
    users(
      limit: $limit
      offset: $offset
      order_by: { createdAt: desc }
      where: {
        _or: [
          { email: { _cast: { String: { _ilike: $search } } } }
          { displayName: { _ilike: $search } }
        ]
      }
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
    usersAggregate(
      where: {
        _or: [
          { email: { _cast: { String: { _ilike: $search } } } }
          { displayName: { _ilike: $search } }
        ]
      }
    ) {
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
        is_verified
        role_type
        base_airport
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

export async function getUsers(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ users: AdminUser[]; total: number }> {
  const search = options?.search?.trim();
  const pattern = search ? `%${search}%` : '%';
  const data = await graphqlAsAdmin<ListUsersResponse>(LIST_USERS_QUERY, {
    limit: options?.limit ?? 25,
    offset: options?.offset ?? 0,
    search: pattern,
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
