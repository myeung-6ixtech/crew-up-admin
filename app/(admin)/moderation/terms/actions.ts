'use server';

import { revalidatePath } from 'next/cache';
import { requireStaffAdmin } from '@/lib/data/auth';
import { addModerationTerms, deleteModerationTerm } from '@/lib/data/moderation';

const LANGS = new Set(['en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'ja', 'zh', 'ko', 'th', 'id', 'ms', 'tl', 'vi', 'ar', 'hi', 'ru', 'tr']);

export async function addTermsAction(formData: FormData) {
  const session = await requireStaffAdmin();
  const raw = String(formData.get('terms') ?? '');
  const lang = String(formData.get('lang') ?? 'en');
  const severity = formData.get('severity') === 'flag' ? 'flag' : 'block';
  if (!LANGS.has(lang)) throw new Error('Unsupported language');
  const added = await addModerationTerms(raw.split(/[\n,]/), lang, severity, session.userId);
  revalidatePath('/moderation/terms');
  return added;
}

export async function deleteTermAction(term: string) {
  const session = await requireStaffAdmin();
  await deleteModerationTerm(term, session.userId);
  revalidatePath('/moderation/terms');
}
