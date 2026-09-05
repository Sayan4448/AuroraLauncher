import { join } from 'node:path';
import { app, BrowserWindow } from 'electron';
import { ModResolver } from './modResolver';
import type { InstallProgress, ModPackManifest } from '../shared/types';

export class InstallManager {
  constructor(private win: BrowserWindow) {}

  async start(manifest: ModPackManifest): Promise<InstallProgress> {
    const state: InstallProgress = {
      packName: manifest.name,
      total: manifest.mods.length,
      completed: 0,
      mods: manifest.mods.map((m, i) => ({
        id: `mod-${i}-${m.name}`,
        name: m.name,
        status: 'pending',
        progress: 0
      }))
    };
    this.send(state);
    const resolver = new ModResolver(
      join(app.getPath('userData'), 'mods'),
      (p) => {
        const i = state.mods.findIndex((x) => x.id === p.id);
        if (i >= 0) state.mods[i] = p;
        state.completed = state.mods.filter(
          (x) => x.status === 'ok' || x.status === 'failed'
        ).length;
        this.send(state);
      }
    );
    await resolver.run(manifest.mods);
    return state;
  }

  private send(s: InstallProgress) {
    this.win.webContents.send('install:progress', s);
  }
}
