# Aurora Launcher ✦

Un starter de launcher Minecraft moderne, pensé comme « Prism Launcher mais plus joli », avec une différence centrale : **les mods manquants sont réparés automatiquement** pendant l'installation.

## Différence avec Prism

Aurora met l'accent sur une installation sans impasse : le résolveur tente Modrinth par hash, puis par projet/nom + version Minecraft + loader. CurseForge est utilisé en repli uniquement si `CURSEFORGE_API_KEY` est configurée.

## Résolution automatique

1. File limitée à 3 téléchargements simultanés.
2. Modrinth v2 : `/version/{hash}`, puis `/search` et `/project/{id}/version`.
3. Sélection du fichier compatible, téléchargement et vérification SHA-1.
4. Trois tentatives par téléchargement.
5. Repli CurseForge si Modrinth échoue et qu'une clé est disponible.
6. États `pending`, `resolving`, `downloading`, `ok`, `failed` envoyés à l'interface via IPC.

## Lancer

```bash
npm install
npm run dev
```

Construire : `npm run build`. Packager : `npm run package`.

## Manifeste

Le pipeline accepte `ModPackManifest` dans `src/shared/types.ts` :

```ts
{ name: 'Mon pack', minecraft: '1.21.1', loader: 'fabric', mods: [
  { name: 'Sodium', projectId: 'AANobbMI', gameVersion: '1.21.1', loader: 'fabric', hash: '...' }
] }
```

Le bouton de démonstration de `App.vue` montre le flux avec Sodium et Lithium. Remplacez `manifest` par le manifeste de votre import.

## CurseForge

Ne mettez jamais la clé dans le dépôt. Lancez Electron avec `CURSEFORGE_API_KEY` dans son environnement. Modrinth reste le fournisseur par défaut.

## Roadmap

- Import `.mrpack` et détection des loaders Java.
- Instances, comptes Microsoft et profils Java.
- Reprise persistante et cache des métadonnées.
- Paramètres JVM, logs et diagnostics exportables.
- Tests d'intégration et releases signées.

MIT. Starter indépendant, pas un fork de Prism Launcher.
