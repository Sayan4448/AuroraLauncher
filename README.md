# Aurora Launcher

Aurora Launcher est un launcher Minecraft moderne en Electron + Vue 3. Il prépare un modpack et résout automatiquement les mods compatibles depuis Modrinth (et CurseForge si une clé API est disponible).

## Importer un modpack en masse

L’importateur accepte plusieurs sources :

- un fichier **`.mrpack`** (Modrinth) ;
- une archive **ZIP CurseForge** ;
- un **dossier de mods** local ;
- une **URL** de modpack ;
- une **liste d’URLs ou de slugs**, collée en masse (une entrée par ligne).

Après l’import, Aurora extrait le manifeste, déduplique les entrées, puis résout les versions correspondant à la version Minecraft et au loader sélectionnés. Les téléchargements sont suivis dans l’interface et limités en concurrence pour rester fiables.

## Catégories

Les mods peuvent être organisés avec un système de catégories :

- créer une catégorie ;
- la renommer ou la supprimer ;
- choisir sa couleur ;
- sélectionner plusieurs mods et leur affecter une catégorie ;
- filtrer l’affichage par catégorie ;
- bénéficier d’une **auto-catégorisation** initiale à partir des tags Modrinth (par exemple `technology`, `magic`, `optimization` ou `adventure`).

La sélection multiple permet de gérer rapidement un grand modpack, tandis que les filtres facilitent la recherche d’un groupe précis.

## Développement

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Le fichier `electron.vite.config.ts` est volontairement nommé ainsi : c’est le nom reconnu par `electron-vite`. Il active `@vitejs/plugin-vue` pour compiler les fichiers `.vue`.

## Construire sous Windows

Pré-requis : Windows 10/11 64 bits, Node.js 20 ou 22 LTS et une connexion internet. Les commandes exactes sont détaillées dans [`BUILD-WINDOWS.md`](BUILD-WINDOWS.md).

```powershell
git clone https://github.com/Sayan4448/AuroraLauncher.git
cd AuroraLauncher
npm install
npm run build
npm run package
```

Les exécutables sont écrits dans `release/` : un installateur NSIS et une version portable. Pour un test sans installateur :

```powershell
npx electron-builder --win --dir
```

## Licence

Voir [LICENSE](LICENSE).
