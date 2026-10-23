import { redirect } from 'next/navigation';
import { currentUser, signIn } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentUser()) redirect('/');
  const { error } = await searchParams;

  async function login(form: FormData) {
    'use server';
    const ok = await signIn(String(form.get('email') ?? ''), String(form.get('password') ?? ''));
    redirect(ok ? '/' : '/login?error=1');
  }

  return (
    <main className="login">
      <h1>Manor</h1>
      <p className="muted">Sign in to edit your website.</p>
      <form action={login} className="fields">
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required autoFocus />
        </label>
        <label className="field">
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {error && <p className="status error">That email and password don&apos;t match.</p>}
        <button className="primary" type="submit">Sign in</button>
      </form>
    </main>
  );
}
