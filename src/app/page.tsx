import Link from 'next/link';
import { listSites } from '@/lib/sites';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const sites = await listSites();
  return (
    <main className="home">
      <h1>Manor</h1>
      <p className="muted">Choose a website to edit.</p>
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
    </main>
  );
}
