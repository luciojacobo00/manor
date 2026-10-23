import type { Json } from './storage';

/**
 * How the editor renders a value. Inferred from the content itself so any site.json works
 * without a hand-written schema; per-site overrides can layer on top later.
 */
export type FieldKind = 'text' | 'longtext' | 'number' | 'boolean' | 'color' | 'url' | 'image' | 'object' | 'list';

const IMAGE = /\.(jpe?g|png|webp|gif|svg|avif)$/i;
const COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const URLISH = /^(https?:\/\/|mailto:|tel:|\/|#)/;

export function fieldKind(key: string, value: Json): FieldKind {
  if (Array.isArray(value)) return 'list';
  if (value !== null && typeof value === 'object') return 'object';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  const s = String(value ?? '');
  if (COLOR.test(s)) return 'color';
  if (IMAGE.test(s) || /^(image|src|logo)$/i.test(key)) return 'image';
  if (URLISH.test(s) || /^(href|url|action)$/i.test(key)) return 'url';
  if (s.length > 80 || /description|intro|subheading|message|text/i.test(key)) return 'longtext';
  return 'text';
}

/** "primaryCta" -> "Primary cta", "startingAt" -> "Starting at". */
export function labelFor(key: string): string {
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** A blank item shaped like the existing ones, for the "Add" button on lists. */
export function blankLike(sample: Json | undefined): Json {
  if (Array.isArray(sample)) return [];
  if (sample !== null && typeof sample === 'object') {
    return Object.fromEntries(Object.entries(sample).map(([k, v]) => [k, blankLike(v)]));
  }
  if (typeof sample === 'number') return 0;
  if (typeof sample === 'boolean') return false;
  return '';
}

/** Short title for a list item, so collapsed rows are recognizable. */
export function itemTitle(item: Json, index: number): string {
  if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
    for (const key of ['title', 'label', 'name', 'heading', 'days', 'platform', 'value']) {
      const v = item[key];
      if (typeof v === 'string' && v) return v;
    }
  }
  if (typeof item === 'string' && item) return item;
  return `Item ${index + 1}`;
}
