# CrewUp Admin Portal

Internal Next.js dashboard for CrewUp operations staff.

## Features (v1)

- Usage analytics dashboard
- User search, account disable/enable, role management
- Airlines taxonomy CRUD
- Read-only variables inventory (enums + app constants + live tag usage)
- MCP endpoint (`POST /api/mcp`) with settings toggle

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Required env vars

```
NEXT_PUBLIC_NHOST_SUBDOMAIN=
NEXT_PUBLIC_NHOST_REGION=
```

Do **not** set `NHOST_ADMIN_SECRET` — the admin app uses session-scoped Hasura permissions only.

## Grant admin access

After signing up through the mobile app or Nhost Auth, grant a staff role:

```sql
INSERT INTO auth.user_roles (user_id, role) VALUES ('<your-user-uuid>', 'staff_admin');
```

## Backend permissions

Deploy Hasura metadata from `crew-up-nhost` before using the dashboard:

```bash
cd ../crew-up-nhost
npm run deploy:cloud
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run verify` | Lint + typecheck |
| `npm run codegen` | Regenerate GraphQL types |

## Architecture

See [documentation/admin-architecture.md](../documentation/admin-architecture.md).
