'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { addTermsAction } from '@/app/(admin)/moderation/terms/actions';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Label, Textarea } from '@/components/ui/input';

const LANG_OPTIONS = [
  ['en', 'English'],
  ['es', 'Spanish'],
  ['fr', 'French'],
  ['de', 'German'],
  ['pt', 'Portuguese'],
  ['it', 'Italian'],
  ['nl', 'Dutch'],
  ['ja', 'Japanese'],
  ['zh', 'Chinese'],
  ['ko', 'Korean'],
  ['th', 'Thai'],
  ['id', 'Indonesian'],
  ['ms', 'Malay'],
  ['tl', 'Tagalog'],
  ['vi', 'Vietnamese'],
  ['ar', 'Arabic'],
  ['hi', 'Hindi'],
  ['ru', 'Russian'],
  ['tr', 'Turkish'],
] as const;

const selectClassName =
  'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900';

export function AddTermsDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      try {
        const added = await addTermsAction(formData);
        form.reset();
        setOpen(false);
        toast.success(
          added ? `Added ${added} ${added === 1 ? 'term' : 'terms'}` : 'Those terms are already in the list',
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add terms';
        toast.error(message);
      }
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Add terms
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Add terms"
        description="One per line or comma-separated. Case, accents and leetspeak (0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a, $→s) are ignored."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="terms">Terms</Label>
            <Textarea id="terms" name="terms" required placeholder={'word\nanother phrase'} autoFocus />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lang">Language</Label>
              <select id="lang" name="lang" defaultValue="en" className={selectClassName}>
                {LANG_OPTIONS.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <select id="severity" name="severity" defaultValue="block" className={selectClassName}>
                <option value="block">Block</option>
                <option value="flag">Flag only (reports)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
