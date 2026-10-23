'use client';

import { useState } from 'react';
import { blankLike, fieldKind, itemTitle, labelFor } from '@/lib/fields';
import type { Json } from '@/lib/storage';

interface Props {
  name: string;
  value: Json;
  onChange: (value: Json) => void;
  /** Top-level section: render children without a wrapping fieldset. */
  root?: boolean;
}

export default function Field({ name, value, onChange, root }: Props) {
  const kind = fieldKind(name, value);
  const label = labelFor(name);

  if (kind === 'object') {
    const obj = value as { [key: string]: Json };
    const children = Object.entries(obj).map(([key, child]) => (
      <Field key={key} name={key} value={child} onChange={(v) => onChange({ ...obj, [key]: v })} />
    ));
    return root ? <div className="fields">{children}</div> : (
      <fieldset className="group"><legend>{label}</legend><div className="fields">{children}</div></fieldset>
    );
  }

  if (kind === 'list') return <ListField label={root ? '' : label} items={value as Json[]} onChange={onChange} />;

  if (kind === 'boolean') {
    return (
      <label className="field checkbox">
        <input type="checkbox" checked={value as boolean} onChange={(e) => onChange(e.target.checked)} />
        {label}
      </label>
    );
  }

  return (
    <label className="field">
      <span>{label}</span>
      {kind === 'longtext' ? (
        <textarea rows={3} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      ) : kind === 'number' ? (
        <input type="number" value={value as number} onChange={(e) => onChange(Number(e.target.value))} />
      ) : kind === 'color' ? (
        <span className="color-row">
          <input type="color" value={String(value)} onChange={(e) => onChange(e.target.value)} />
          <input type="text" value={String(value)} onChange={(e) => onChange(e.target.value)} />
        </span>
      ) : (
        <input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}
          placeholder={kind === 'image' ? 'Image file name or URL' : undefined} />
      )}
    </label>
  );
}

function ListField({ label, items, onChange }: { label: string; items: Json[]; onChange: (v: Json) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const simple = items.every((i) => typeof i !== 'object' || i === null);

  const update = (index: number, v: Json) => onChange(items.map((item, i) => (i === index ? v : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const move = (index: number, delta: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };
  const add = () => {
    onChange([...items, blankLike(items[0] ?? '')]);
    setOpen(items.length);
  };

  return (
    <fieldset className="group list">
      {label && <legend>{label}</legend>}
      {items.map((item, i) => (
        <div key={i} className="list-item">
          <div className="list-row">
            {simple ? (
              <input type="text" value={String(item ?? '')} onChange={(e) => update(i, e.target.value)} />
            ) : (
              <button className="link" onClick={() => setOpen(open === i ? null : i)}>
                {open === i ? '▾' : '▸'} {itemTitle(item, i)}
              </button>
            )}
            <span className="row-actions">
              <button className="icon" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
              <button className="icon" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
              <button className="icon danger" onClick={() => remove(i)} aria-label="Remove">✕</button>
            </span>
          </div>
          {!simple && open === i && <Field name="" value={item} onChange={(v) => update(i, v)} root />}
        </div>
      ))}
      <button className="secondary add" onClick={add}>+ Add</button>
    </fieldset>
  );
}
