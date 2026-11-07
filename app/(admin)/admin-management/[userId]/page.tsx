import { AccountDetail, accountPageTitle } from '@/components/admin/account-detail';

type Props = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  return accountPageTitle(userId, 'Admin management');
}

export default async function AdminAccountPage({ params }: Props) {
  const { userId } = await params;
  return (
    <AccountDetail
      userId={userId}
      title="Admin account"
      description="Dashboard access. Revoking the last of moderator and staff_admin returns this person to Users."
      backHref="/admin-management"
      backLabel="Back to admin management"
    />
  );
}
