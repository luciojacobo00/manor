import { notFound } from 'next/navigation';
import Editor from '@/components/Editor';
import { getSite } from '@/lib/sites';
import { storeFor } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export default async function SitePage({ params }: { params: Promise<{ siteId: string }> }) {
  const site = await getSite((await params).siteId);
  if (!site) notFound();
  const snapshot = await storeFor(site.storage).load();
  return <Editor site={{ id: site.id, name: site.name, previewUrl: site.previewUrl }} initial={snapshot} />;
}
