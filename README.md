# Manor

Manor lets companies edit their own websites without touching code.

This MVP edits sites whose content lives in a single JSON file (like the Manor Web Astro
template's `src/config/site.json`). Editing a field and pressing **Publish** saves the file;
for GitHub-backed sites that is a commit, and the host (Netlify, Vercel, Cloudflare Pages)
rebuilds the live site.

## Run it

```bash
npm install
npm run add-user -- you@example.com harbor-pine --name "Your Name"   # prompts for a password
npm run dev        # http://localhost:3000, sign in with that account
```

The demo site (`content/demo-bakery.json`) belongs to the company `harbor-pine` and is stored
locally, so it works with no other setup.

## Accounts

Every site in `manor.sites.json` has a `companyId`. Users belong to one company and can only see
and edit that company's sites; anyone else gets "not found", in the pages and the API alike.
Users with `--admin` (Manor Web staff) can edit every site.

```bash
npm run add-user -- owner@client.com client-co --name "Client Owner"   # client editor
npm run add-user -- you@manorweb.com manor --admin                    # staff
```

Running it again for the same email resets that user's password. Users are stored in
`manor.users.json` (password hashes only, kept out of git). In production, set `MANOR_SECRET`
(see `.env.example`); Manor refuses to sign anyone in without it.

## Add a client site

Add an entry to `manor.sites.json`:

```json
{
  "id": "acme",
  "name": "Acme Co",
  "companyId": "acme",
  "previewUrl": "https://acme.netlify.app",
  "storage": { "type": "github", "repo": "owner/acme-site", "branch": "main", "path": "src/config/site.json" }
}
```

and set `GITHUB_TOKEN` in `.env.local` (see `.env.example`).

## How it is built

- **Next.js + TypeScript** app (`src/app`).
- **Content stores** (`src/lib/storage.ts`): `local` file or `github` (Contents API). Saves carry the
  version they were loaded from, so two people editing at once can't silently overwrite each other.
- **Sign-in** (`src/lib/auth.ts`): email and password, scrypt-hashed, with an HMAC-signed session
  cookie. Every page and API call checks the user's company against the site's.
- **Form editor** (`src/components`): fields are inferred from the JSON itself (text, long text,
  number, toggle, color, image, link, nested groups, reorderable lists), so any site.json works
  without a hand-written schema.

## Next steps

1. Move sites and users into a database (Postgres) with an admin screen to invite clients, plus
   password reset by email and sign-in rate limiting.
2. Image uploads into the site repo.
3. A GitHub App instead of a personal token, so clients connect repos in a click.
4. Live preview while typing (draft branch + host preview deploys).
