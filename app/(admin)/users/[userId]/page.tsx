import { AccountDetail, accountPageTitle } from '@/components/admin/account-detail';

type Props = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  return accountPageTitle(userId, 'CrewUp Admin');
}

export default async function UserDetailPage({ params }: Props) {
  const { userId } = await params;
  return (
    <AccountDetail
      userId={userId}
      backHref="/users"
      backLabel="Back to users"
    />
  );
}
