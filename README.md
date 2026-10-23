# Manor

Manor lets companies edit their own websites without touching code.

This MVP edits sites whose content lives in a single JSON file (like the Manor Web Astro
template's `src/config/site.json`). Editing a field and pressing **Publish** saves the file;
for GitHub-backed sites that is a commit, and the host (Netlify, Vercel, Cloudflare Pages)
rebuilds the live site.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

The demo site (`content/demo-bakery.json`) is stored locally, so it works with no setup.

## Add a client site

Add an entry to `manor.sites.json`:

```json
{
  "id": "acme",
  "name": "Acme Co",
  "previewUrl": "https://acme.netlify.app",
  "storage": { "type": "github", "repo": "owner/acme-site", "branch": "main", "path": "src/config/site.json" }
}
```

and set `GITHUB_TOKEN` in `.env.local` (see `.env.example`).

## How it is built

- **Next.js + TypeScript** app (`src/app`).
- **Content stores** (`src/lib/storage.ts`): `local` file or `github` (Contents API). Saves carry the
  version they were loaded from, so two people editing at once can't silently overwrite each other.
- **Form editor** (`src/components`): fields are inferred from the JSON itself (text, long text,
  number, toggle, color, image, link, nested groups, reorderable lists), so any site.json works
  without a hand-written schema.

## Next steps

1. Sign-in and accounts: each company sees only its own sites (Postgres + Auth.js or Clerk).
2. Image uploads into the site repo.
3. A GitHub App instead of a personal token, so clients connect repos in a click.
4. Live preview while typing (draft branch + host preview deploys).
