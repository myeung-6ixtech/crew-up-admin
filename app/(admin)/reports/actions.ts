'use server';

import { revalidatePath } from 'next/cache';
import { requireStaffAdmin } from '@/lib/data/auth';
import { runModerationAction, type ModerationAction } from '@/lib/data/moderation';

const ACTIONS = new Set<ModerationAction>(['reviewing', 'dismiss', 'resolve', 'remove_message', 'cancel_meet', 'disable_user']);

export async function moderateReportAction(reportId: string, formData: FormData) {
  await requireStaffAdmin();
  const action = String(formData.get('action') ?? '') as ModerationAction;
  if (!ACTIONS.has(action)) throw new Error('Unknown action');
  const note = String(formData.get('note') ?? '');
  await runModerationAction(reportId, action, note);
  revalidatePath('/reports');
  revalidatePath(`/reports/${reportId}`);
}
