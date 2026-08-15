import 'server-only';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getAirlines, createAirline, updateAirline, getEventTagUsage } from '@/lib/data/airlines';
import { getDashboardMetrics } from '@/lib/data/metrics';
import { getUsers, getUserById } from '@/lib/data/users';
import { airlineSchema } from '@/lib/schemas/airline.schema';
import { logMcpInvocation } from '@/lib/mcp/log';
import type { AuthSession } from '@/lib/data/auth';

export function registerTools(server: McpServer, session: AuthSession) {
  const log = (tool: string) => {
    logMcpInvocation({
      tool,
      adminId: session.userId,
      adminEmail: session.email,
    });
  };

  server.registerTool(
    'get_usage_metrics',
    { description: 'Get CrewUp usage and safety metrics for the admin dashboard' },
    async () => {
      log('get_usage_metrics');
      const metrics = await getDashboardMetrics();
      return { content: [{ type: 'text', text: JSON.stringify(metrics, null, 2) }] };
    },
  );

  server.registerTool(
    'list_users',
    {
      description: 'List admin-visible users',
      inputSchema: {
        search: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      },
    },
    async ({ search, limit, offset }) => {
      log('list_users');
      const result = await getUsers({ search, limit, offset });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    'get_user',
    {
      description: 'Get a single user by id',
      inputSchema: { id: z.string().uuid() },
    },
    async ({ id }) => {
      log('get_user');
      const user = await getUserById(id);
      return { content: [{ type: 'text', text: JSON.stringify(user, null, 2) }] };
    },
  );

  server.registerTool(
    'list_airlines',
    { description: 'List all airlines in the reference table' },
    async () => {
      log('list_airlines');
      const airlines = await getAirlines();
      return { content: [{ type: 'text', text: JSON.stringify(airlines, null, 2) }] };
    },
  );

  server.registerTool(
    'create_airline',
    {
      description: 'Create a new airline reference row',
      inputSchema: airlineSchema.shape,
    },
    async (input) => {
      if (session.role !== 'staff_admin') {
        throw new Error('Staff admin role required');
      }
      log('create_airline');
      const airline = await createAirline(input, session.userId);
      return { content: [{ type: 'text', text: JSON.stringify(airline, null, 2) }] };
    },
  );

  server.registerTool(
    'update_airline',
    {
      description: 'Update an existing airline reference row',
      inputSchema: {
        id: z.string().uuid(),
        ...airlineSchema.shape,
      },
    },
    async ({ id, ...input }) => {
      if (session.role !== 'staff_admin') {
        throw new Error('Staff admin role required');
      }
      log('update_airline');
      const airline = await updateAirline(id, input, session.userId);
      return { content: [{ type: 'text', text: JSON.stringify(airline, null, 2) }] };
    },
  );

  server.registerTool(
    'list_event_tag_usage',
    { description: 'List live event tag usage counts from events.tags' },
    async () => {
      log('list_event_tag_usage');
      const tags = await getEventTagUsage();
      return { content: [{ type: 'text', text: JSON.stringify(tags, null, 2) }] };
    },
  );
}

export function createMcpServer(session: AuthSession) {
  const server = new McpServer({ name: 'crewup-admin-mcp', version: '1.0.0' });
  registerTools(server, session);
  return server;
}
