import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import { InstallManager } from './installManager';
import type { ModPackManifest } from '../shared/types';

let win: BrowserWindow;

function createWindow(): void {
  win = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#090b12',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.env.ELECTRON_RENDERER_URL) win.loadURL(process.env.ELECTRON_RENDERER_URL);
  else win.loadFile(join(__dirname, '../renderer/index.html'));
  ipcMain.handle('install:start', (_: Electron.IpcMainInvokeEvent, m: ModPackManifest) =>
    new InstallManager(win).start(m)
  );
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
