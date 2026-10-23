import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SiteRecord } from './sites';

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export interface User {
  email: string;
  name: string;
  /** The company whose sites this user may edit. */
  companyId: string;
  /** "admin" is Manor staff and can edit every site; "editor" is a client. */
  role: 'admin' | 'editor';
  passwordHash: string;
}

export type SessionUser = Omit<User, 'passwordHash'>;

const COOKIE = 'manor_session';
const MAX_AGE = 60 * 60 * 24 * 14; // two weeks

// MVP user store: a JSON file kept out of git. Swap for a database table along with the site registry.
const USERS_FILE = path.resolve(process.cwd(), process.env.MANOR_USERS_FILE || 'manor.users.json');

export async function listUsers(): Promise<User[]> {
  try {
    return (JSON.parse(await fs.readFile(USERS_FILE, 'utf8')) as { users: User[] }).users;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

export async function saveUsers(users: User[]): Promise<void> {
  await fs.writeFile(USERS_FILE, JSON.stringify({ users }, null, 2) + '\n', { mode: 0o600 });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await scrypt(password, Buffer.from(salt, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

function secret(): string {
  const value = process.env.MANOR_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === 'production') throw new Error('MANOR_SECRET must be set to at least 32 characters.');
  return 'manor-dev-secret-do-not-use-in-production';
}

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');

/** Returns the signed-in user, or null. Re-reads the user so removed accounts lose access immediately. */
export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const { email, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { email: string; exp: number };
  if (Date.now() > exp) return null;
  const user = (await listUsers()).find((u) => u.email === email);
  if (!user) return null;
  const { passwordHash: _, ...rest } = user;
  return rest;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect('/login');
  return user;
}

export async function signIn(email: string, password: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const user = (await listUsers()).find((u) => u.email === normalized);
  // Hash anyway on unknown emails so response time doesn't reveal which accounts exist.
  const ok = await verifyPassword(password, user?.passwordHash ?? 'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$' + 'A'.repeat(86) + '==');
  if (!user || !ok) return false;

  const payload = Buffer.from(JSON.stringify({ email: user.email, exp: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
  return true;
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export const canEdit = (user: SessionUser, site: SiteRecord) => user.role === 'admin' || user.companyId === site.companyId;
