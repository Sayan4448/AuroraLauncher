export type ModStatus = 'pending' | 'resolving' | 'downloading' | 'ok' | 'failed';
export interface ModManifestEntry {
  name: string;
  version?: string;
  gameVersion?: string;
  loader?: string;
  projectId?: string;
  hash?: string;
  optional?: boolean;
}
export interface ModPackManifest {
  name: string;
  minecraft: string;
  loader?: string;
  mods: ModManifestEntry[];
}
export interface ModProgress {
  id: string;
  name: string;
  status: ModStatus;
  source?: 'modrinth' | 'curseforge';
  progress: number;
  message?: string;
  filePath?: string;
}
export interface InstallProgress {
  packName: string;
  total: number;
  completed: number;
  mods: ModProgress[];
}
