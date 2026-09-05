import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { ModManifestEntry, ModProgress } from '../shared/types';

const API = 'https://api.modrinth.com/v2';
const CF = 'https://api.curseforge.com/v1';

export type ProgressListener = (p: ModProgress) => void;

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json() as Promise<T>;
}

export class ModResolver {
  private concurrency = 3;
  constructor(private dir: string, private onProgress: ProgressListener) {}

  async resolveAndDownload(entry: ModManifestEntry, index: number): Promise<ModProgress> {
    const id = `mod-${index}-${entry.name}`;
    const emit = (x: Partial<ModProgress>) =>
      this.onProgress({ id, name: entry.name, status: 'resolving', progress: 0, ...x });
    emit({});
    try {
      let candidate = await this.modrinth(entry);
      if (!candidate && process.env.CURSEFORGE_API_KEY) candidate = await this.curseforge(entry);
      if (!candidate) throw new Error('Aucune version compatible trouvée');

      emit({ status: 'downloading', source: candidate.source, message: candidate.file.name, progress: 0 });
      await this.download(
        candidate.file.url,
        join(this.dir, candidate.file.name),
        candidate.file.sha1,
        (p) => emit({ status: 'downloading', progress: p, message: candidate!.file.name })
      );

      const result: ModProgress = {
        id,
        name: entry.name,
        status: 'ok',
        source: candidate.source,
        progress: 100,
        filePath: join(this.dir, candidate.file.name)
      };
      this.onProgress(result);
      return result;
    } catch (e) {
      const result: ModProgress = {
        id,
        name: entry.name,
        status: 'failed',
        progress: 0,
        message: e instanceof Error ? e.message : String(e)
      };
      this.onProgress(result);
      return result;
    }
  }

  private async modrinth(e: ModManifestEntry): Promise<{ source: 'modrinth'; file: { name: string; url: string; sha1?: string } } | null> {
    try {
      let version: any;
      if (e.hash) {
        try { version = await json<any>(`${API}/version/${e.hash}`); } catch { /* fall through */ }
      }
      if (!version) {
        let project = e.projectId;
        if (!project) {
          const q = encodeURIComponent(e.name);
          const data = await json<any>(
            `${API}/search?query=${q}&facets=${encodeURIComponent(
              JSON.stringify([
                [`categories:${e.loader || 'fabric'}`],
                [`versions:${e.gameVersion || '1.21.1'}`]
              ])
            )}`
          );
          project = data.hits?.[0]?.project_id;
        }
        if (project) {
          const versions = await json<any[]>(
            `${API}/project/${project}/version?game_versions=${encodeURIComponent(
              JSON.stringify([e.gameVersion || '1.21.1'])
            )}&loaders=${encodeURIComponent(JSON.stringify([e.loader || 'fabric']))}`
          );
          version =
            versions.find((v) => !e.version || v.version_number === e.version || v.id === e.version) ||
            versions[0];
        }
      }
      if (!version?.files?.length) return null;
      const f = version.files.find((x: any) => x.primary) || version.files[0];
      return { source: 'modrinth', file: { name: f.filename, url: f.url, sha1: f.hashes?.sha1 } };
    } catch {
      return null;
    }
  }

  private async curseforge(
    e: ModManifestEntry
  ): Promise<{ source: 'curseforge'; file: { name: string; url: string; sha1?: string } } | null> {
    const key = process.env.CURSEFORGE_API_KEY!;
    const headers = { 'x-api-key': key };
    try {
      let id = e.projectId;
      if (!id) {
        const d = await json<any>(
          `${CF}/mods/search?gameId=432&searchFilter=${encodeURIComponent(
            e.name
          )}&gameVersion=${encodeURIComponent(e.gameVersion || '1.21.1')}`,
          { headers }
        );
        id = d.data?.[0]?.id;
      }
      if (!id) return null;
      const d = await json<any>(
        `${CF}/mods/${id}/files?gameVersion=${encodeURIComponent(
          e.gameVersion || '1.21.1'
        )}&pageSize=20`,
        { headers }
      );
      const f =
        d.data?.find((x: any) => !e.version || x.displayName?.includes(e.version)) || d.data?.[0];
      if (!f) return null;
      return {
        source: 'curseforge',
        file: {
          name: f.fileName,
          url: f.downloadUrl,
          sha1: f.hashes?.find((x: any) => x.algo === 1)?.value
        }
      };
    } catch {
      return null;
    }
  }

  private async download(
    url: string,
    path: string,
    expected: string | undefined,
    onProgress: (p: number) => void
  ): Promise<void> {
    if (!url) throw new Error('URL de téléchargement indisponible');
    await mkdir(this.dir, { recursive: true });
    for (let attempt = 1; attempt <= 3; attempt++) {
      const tmp = `${path}.part`;
      try {
        const r = await fetch(url);
        if (!r.ok || !r.body) throw new Error(`Téléchargement ${r.status}`);
        const total = Number(r.headers.get('content-length') || 0);
        const hash = createHash('sha1');
        let done = 0;
        const transform = new TransformStream<Uint8Array, Uint8Array>({
          transform(c, ctl) {
            hash.update(c);
            done += c.byteLength;
            onProgress(total ? Math.round((done / total) * 100) : 0);
            ctl.enqueue(c);
          }
        });
        await pipeline(r.body as any, transform as any, createWriteStream(tmp));
        if (expected && hash.digest('hex').toLowerCase() !== expected.toLowerCase())
          throw new Error('Vérification SHA-1 échouée');
        await rename(tmp, path);
        return;
      } catch (err) {
        await unlink(tmp).catch(() => {});
        if (attempt === 3) throw err;
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }

  async run(entries: ModManifestEntry[]): Promise<ModProgress[]> {
    const out: ModProgress[] = [];
    let cursor = 0;
    const worker = async () => {
      while (cursor < entries.length) {
        const i = cursor++;
        out[i] = await this.resolveAndDownload(entries[i], i);
      }
    };
    await Promise.all(Array.from({ length: Math.min(this.concurrency, entries.length) }, worker));
    return out;
  }
}
