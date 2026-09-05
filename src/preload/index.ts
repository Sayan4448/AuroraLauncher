import { contextBridge, ipcRenderer } from 'electron';
import type { InstallProgress, ModPackManifest } from '../shared/types';

contextBridge.exposeInMainWorld('aurora', {
  startInstall: (manifest: ModPackManifest) => ipcRenderer.invoke('install:start', manifest),
  onProgress: (cb: (p: InstallProgress) => void) => {
    const listener = (_: Electron.IpcRendererEvent, p: InstallProgress) => cb(p);
    ipcRenderer.on('install:progress', listener);
    return () => ipcRenderer.removeListener('install:progress', listener);
  }
});
