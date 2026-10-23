import Link from 'next/link';
import { redirect } from 'next/navigation';
import SignOut from '@/components/SignOut';
import { requireUser } from '@/lib/auth';
import { sitesFor } from '@/lib/sites';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await requireUser();
  const sites = await sitesFor(user);
  // Most clients have one site: take them straight to it.
  if (sites.length === 1 && user.role !== 'admin') redirect(`/sites/${sites[0].id}`);

  return (
    <main className="home">
      <header className="home-header">
        <h1>Manor</h1>
        <SignOut />
      </header>
      <p className="muted">Signed in as {user.name}. Choose a website to edit.</p>
      {sites.length === 0 ? (
        <p>No websites are connected to your account yet.</p>
      ) : (
        <ul className="site-list">
          {sites.map((site) => (
            <li key={site.id}>
              <Link href={`/sites/${site.id}`}>
                <strong>{site.name}</strong>
                <span className="muted">{site.storage.type === 'github' ? site.storage.repo : 'Local file'}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
