import type { InstallProgress, ModPackManifest } from '../shared/types';

declare global {
  interface Window {
    aurora: {
      startInstall: (m: ModPackManifest) => Promise<InstallProgress>;
      onProgress: (cb: (p: InstallProgress) => void) => () => void;
    };
  }
}

export {};
