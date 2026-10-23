import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StorageConfig } from './sites';

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface Snapshot {
  content: Json;
  /** Opaque token used to reject saves made against stale content. */
  version: string;
}

export class ConflictError extends Error {}

export interface ContentStore {
  load(): Promise<Snapshot>;
  save(content: Json, baseVersion: string, message: string): Promise<Snapshot>;
}

export function storeFor(config: StorageConfig): ContentStore {
  return config.type === 'local' ? new LocalStore(config.path) : new GitHubStore(config);
}

const serialize = (content: Json) => JSON.stringify(content, null, 2) + '\n';

/** Reads and writes a JSON file on disk. Used for development and demos. */
class LocalStore implements ContentStore {
  private file: string;

  constructor(relativePath: string) {
    this.file = path.join(process.cwd(), relativePath);
  }

  async load(): Promise<Snapshot> {
    const [raw, stat] = await Promise.all([fs.readFile(this.file, 'utf8'), fs.stat(this.file)]);
    return { content: JSON.parse(raw), version: String(stat.mtimeMs) };
  }

  async save(content: Json, baseVersion: string): Promise<Snapshot> {
    const current = await this.load();
    if (current.version !== baseVersion) throw new ConflictError('Content changed since it was loaded.');
    await fs.writeFile(this.file, serialize(content));
    return this.load();
  }
}

/**
 * Commits the content file to a GitHub repo through the Contents API. The site's host
 * (Netlify, Vercel, Cloudflare Pages) rebuilds on the new commit, which is the "publish".
 */
class GitHubStore implements ContentStore {
  constructor(private config: Extract<StorageConfig, { type: 'github' }>) {}

  private async request(init?: RequestInit) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN is not set.');
    const { repo, path: filePath, branch } = this.config;
    const url = `https://api.github.com/repos/${repo}/contents/${filePath}` + (init ? '' : `?ref=${branch}`);
    const res = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    });
    if (res.status === 409 || res.status === 422) throw new ConflictError('Content changed on GitHub since it was loaded.');
    if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async load(): Promise<Snapshot> {
    const file = await this.request();
    const raw = Buffer.from(file.content, 'base64').toString('utf8');
    return { content: JSON.parse(raw), version: file.sha };
  }

  async save(content: Json, baseVersion: string, message: string): Promise<Snapshot> {
    const result = await this.request({
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: Buffer.from(serialize(content)).toString('base64'),
        sha: baseVersion,
        branch: this.config.branch,
      }),
    });
    return { content, version: result.content.sha };
  }
}
