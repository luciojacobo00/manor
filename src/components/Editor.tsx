'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { labelFor } from '@/lib/fields';
import type { Json, Snapshot } from '@/lib/storage';
import Field from './Field';

type Obj = { [key: string]: Json };

interface Props {
  site: { id: string; name: string; previewUrl: string };
  initial: Snapshot;
}

export default function Editor({ site, initial }: Props) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState<Obj>(initial.content as Obj);
  const sections = Object.keys(saved.content as Obj);
  const [section, setSection] = useState(sections[0]);
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' | 'error' | 'done'; text?: string }>({ kind: 'idle' });

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved.content), [draft, saved]);

  async function publish() {
    setStatus({ kind: 'saving' });
    const res = await fetch(`/api/sites/${site.id}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: draft, version: saved.version, message: `Update ${labelFor(section).toLowerCase()} via Manor` }),
    });
    const body = await res.json();
    if (!res.ok) return setStatus({ kind: 'error', text: body.error ?? 'Could not publish.' });
    setSaved(body);
    setStatus({ kind: 'done', text: 'Published. Your site will update in a minute or two.' });
  }

  return (
    <div className="editor">
      <aside className="sidebar">
        <Link href="/" className="brand">Manor</Link>
        <div className="site-name">{site.name}</div>
        <nav>
          {sections.map((key) => (
            <button key={key} className={key === section ? 'active' : ''} onClick={() => setSection(key)}>
              {labelFor(key)}
            </button>
          ))}
        </nav>
      </aside>

      <main className="form-pane">
        <header className="toolbar">
          <h1>{labelFor(section)}</h1>
          <div className="actions">
            {status.text && <span className={`status ${status.kind}`}>{status.text}</span>}
            <button className="secondary" disabled={!dirty} onClick={() => setDraft(saved.content as Obj)}>Discard</button>
            <button className="primary" disabled={!dirty || status.kind === 'saving'} onClick={publish}>
              {status.kind === 'saving' ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </header>
        <Field
          name={section}
          value={draft[section]}
          onChange={(v) => {
            setDraft({ ...draft, [section]: v });
            if (status.kind !== 'saving') setStatus({ kind: 'idle' });
          }}
          root
        />
      </main>

      {site.previewUrl && (
        <section className="preview">
          <iframe src={site.previewUrl} title={`${site.name} preview`} />
        </section>
      )}
    </div>
  );
}
