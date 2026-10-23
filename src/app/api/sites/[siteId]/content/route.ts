import { NextResponse } from 'next/server';
import { getSite } from '@/lib/sites';
import { ConflictError, storeFor, type Json } from '@/lib/storage';

type Params = { params: Promise<{ siteId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const site = await getSite((await params).siteId);
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  return NextResponse.json(await storeFor(site.storage).load());
}

export async function PUT(req: Request, { params }: Params) {
  const site = await getSite((await params).siteId);
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  const { content, version, message } = (await req.json()) as { content: Json; version: string; message?: string };
  try {
    const saved = await storeFor(site.storage).save(content, version, message || `Update ${site.name} content via Manor`);
    return NextResponse.json(saved);
  } catch (err) {
    if (err instanceof ConflictError) return NextResponse.json({ error: err.message }, { status: 409 });
    throw err;
  }
}
