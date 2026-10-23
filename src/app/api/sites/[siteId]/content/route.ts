import { NextResponse } from 'next/server';
import { canEdit, currentUser } from '@/lib/auth';
import { getSite } from '@/lib/sites';
import { ConflictError, storeFor, type Json } from '@/lib/storage';

type Params = { params: Promise<{ siteId: string }> };

async function authorize(params: Params['params']) {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: 'Sign in required' }, { status: 401 }) };
  const site = await getSite((await params).siteId);
  if (!site || !canEdit(user, site)) return { error: NextResponse.json({ error: 'Site not found' }, { status: 404 }) };
  return { user, site };
}

export async function GET(_req: Request, { params }: Params) {
  const auth = await authorize(params);
  if ('error' in auth) return auth.error;
  return NextResponse.json(await storeFor(auth.site.storage).load());
}

export async function PUT(req: Request, { params }: Params) {
  const auth = await authorize(params);
  if ('error' in auth) return auth.error;
  const { site, user } = auth;
  const { content, version, message } = (await req.json()) as { content: Json; version: string; message?: string };
  try {
    const summary = message || `Update ${site.name} content`;
    const saved = await storeFor(site.storage).save(content, version, `${summary} (by ${user.email} via Manor)`);
    return NextResponse.json(saved);
  } catch (err) {
    if (err instanceof ConflictError) return NextResponse.json({ error: err.message }, { status: 409 });
    throw err;
  }
}
