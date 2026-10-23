import { redirect } from 'next/navigation';
import { signOut } from '@/lib/auth';

export default function SignOut({ className }: { className?: string }) {
  async function logout() {
    'use server';
    await signOut();
    redirect('/login');
  }
  return (
    <form action={logout}>
      <button type="submit" className={className ?? 'secondary'}>Sign out</button>
    </form>
  );
}
