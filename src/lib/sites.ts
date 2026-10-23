import { promises as fs } from 'node:fs';
import path from 'node:path';

export type StorageConfig =
  | { type: 'local'; path: string }
  | { type: 'github'; repo: string; branch: string; path: string };

export interface SiteRecord {
  id: string;
  name: string;
  /** The company that owns this site; its users can edit it. */
  companyId: string;
  /** Live or staging URL shown in the preview pane. Empty hides the preview. */
  previewUrl: string;
  storage: StorageConfig;
}

// MVP registry: a JSON file. Swap for a database table once there are real accounts.
const REGISTRY = path.join(process.cwd(), 'manor.sites.json');

export async function listSites(): Promise<SiteRecord[]> {
  const raw = await fs.readFile(REGISTRY, 'utf8');
  return (JSON.parse(raw) as { sites: SiteRecord[] }).sites;
}

export async function getSite(id: string): Promise<SiteRecord | undefined> {
  return (await listSites()).find((s) => s.id === id);
}

/** Sites the user is allowed to edit. */
export async function sitesFor(user: { role: string; companyId: string }): Promise<SiteRecord[]> {
  const sites = await listSites();
  return user.role === 'admin' ? sites : sites.filter((s) => s.companyId === user.companyId);
}
