import type { Metadata } from 'next';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: { absolute: 'Delete your CrewUp account' },
  description: 'How to delete your CrewUp account and what happens to your data.',
};

/** Public page linked from Google Play's "delete account" field. No sign-in required. */
export default function DeleteAccountPage() {
  const email = env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const mailto = `mailto:${email}?subject=${encodeURIComponent('Delete my CrewUp account')}`;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-zinc-800">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Delete your CrewUp account</h1>
      <p className="mt-4 leading-7">
        You can delete your account from inside the app at any time. Your account is hidden and signed out straight away and
        erased after 30 days. Sign in again within those 30 days if you change your mind.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-zinc-900">In the app</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-6 leading-7">
        <li>Open CrewUp and tap the menu in the top corner.</li>
        <li>Tap <strong>Account security</strong>.</li>
        <li>Tap <strong>Delete account</strong>.</li>
        <li>Type DELETE (and your password if you signed up with email), then tap <strong>Delete my account</strong>.</li>
      </ol>

      <h2 className="mt-10 text-xl font-semibold text-zinc-900">Can&apos;t open the app?</h2>
      <p className="mt-3 leading-7">
        Email{' '}
        <a className="font-medium text-lime-800 underline" href={mailto}>
          {email}
        </a>{' '}
        from the address on your account and ask us to delete it. We reply within 7 days and follow the same 30-day schedule.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-zinc-900">What is deleted</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
        <li>Your profile, photos, username and crew details.</li>
        <li>Your trips, layovers, connections, blocks and notifications.</li>
        <li>Meets you host. Upcoming meets and RSVPs are cancelled as soon as you ask.</li>
        <li>Your sign-in details.</li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-zinc-900">What is kept</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
        <li>
          Messages you sent stay in other people&apos;s chats as &ldquo;Message removed&rdquo;. The text and photos are erased and
          your name is no longer attached.
        </li>
        <li>Safety reports you filed are kept without your name, so our team can finish acting on them.</li>
      </ul>
    </main>
  );
}
