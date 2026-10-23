import { notFound } from 'next/navigation';
import Editor from '@/components/Editor';
import SignOut from '@/components/SignOut';
import { canEdit, requireUser } from '@/lib/auth';
import { getSite } from '@/lib/sites';
import { storeFor } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export default async function SitePage({ params }: { params: Promise<{ siteId: string }> }) {
  const user = await requireUser();
  const site = await getSite((await params).siteId);
  // Same response for "missing" and "not yours", so site ids of other companies aren't revealed.
  if (!site || !canEdit(user, site)) notFound();
  const snapshot = await storeFor(site.storage).load();
  return (
    <Editor
      site={{ id: site.id, name: site.name, previewUrl: site.previewUrl }}
      initial={snapshot}
      signOut={<SignOut className="link sign-out" />}
    />
  );
}
