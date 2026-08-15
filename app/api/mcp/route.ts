import 'server-only';

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { getAuthSession } from '@/lib/data/auth';
import { createMcpServer } from '@/lib/mcp/tools';
import { checkMcpRateLimit, isMcpEnabled } from '@/lib/mcp/log';

export async function POST(request: Request) {
  if (!isMcpEnabled()) {
    return new Response('MCP endpoint disabled', { status: 503 });
  }

  const session = await getAuthSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!checkMcpRateLimit(session.userId)) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  const server = createMcpServer(session);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);
  const response = await transport.handleRequest(request);
  await transport.close();
  await server.close();
  return response;
}

export async function GET() {
  return new Response('MCP endpoint active. Use POST with an authenticated session.', {
    status: 405,
  });
}
