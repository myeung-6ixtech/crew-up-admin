export type McpInvocation = {
  tool: string;
  adminId: string;
  adminEmail: string;
  timestamp: string;
};

const MAX_LOG_ENTRIES = 100;
const invocationLog: McpInvocation[] = [];

export function logMcpInvocation(entry: Omit<McpInvocation, 'timestamp'>) {
  invocationLog.unshift({ ...entry, timestamp: new Date().toISOString() });
  if (invocationLog.length > MAX_LOG_ENTRIES) {
    invocationLog.length = MAX_LOG_ENTRIES;
  }
  console.info(JSON.stringify({ event: 'admin.mcp.invocation', ...entry }));
}

export function getMcpInvocations(limit = 20): McpInvocation[] {
  return invocationLog.slice(0, limit);
}

let mcpEnabled = true;

export function isMcpEnabled(): boolean {
  return mcpEnabled;
}

export function setMcpEnabled(enabled: boolean) {
  mcpEnabled = enabled;
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkMcpRateLimit(key: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const current = rateLimitMap.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) {
    return false;
  }
  current.count += 1;
  return true;
}
