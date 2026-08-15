'use server';

import { setMcpEnabled } from '@/lib/mcp/log';
import { requireStaffAdmin } from '@/lib/data/auth';

export async function setMcpEnabledAction(enabled: boolean) {
  await requireStaffAdmin();
  setMcpEnabled(enabled);
}
