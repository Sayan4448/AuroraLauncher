<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { InstallProgress, ModPackManifest } from '../shared/types';

const installing = ref(false);
const progress = ref<InstallProgress>({ packName: 'Aucun pack sélectionné', total: 0, completed: 0, mods: [] });

const manifest: ModPackManifest = {
  name: 'Aurora Demo Pack',
  minecraft: '1.21.1',
  loader: 'fabric',
  mods: [
    { name: 'Sodium', version: '0.6.5', gameVersion: '1.21.1', loader: 'fabric' },
    { name: 'Lithium', gameVersion: '1.21.1', loader: 'fabric' }
  ]
};

const missing = computed(() => progress.value.mods.filter(m => m.status === 'resolving' || m.status === 'downloading'));
const percent = computed(() => progress.value.total ? Math.round(progress.value.completed / progress.value.total * 100) : 0);

onMounted(() => window.aurora.onProgress(p => { progress.value = p; installing.value = true; }));

async function install() {
  installing.value = true;
  progress.value = {
    packName: manifest.name,
    total: manifest.mods.length,
    completed: 0,
    mods: manifest.mods.map((m, i) => ({ id: `mod-${i}-${m.name}`, name: m.name, status: 'pending', progress: 0 }))
  };
  await window.aurora.startInstall(manifest);
}
</script>

<template>
  <div class="shell">
    <aside>
      <div class="brand">
        <span class="orb">✦</span>
        <div>
          <b>Aurora</b>
          <small>LAUNCHER</small>
        </div>
      </div>
      <nav>
        <a class="active">⌂ <span>Accueil</span></a>
        <a>▣ <span>Instances</span></a>
        <a>⚙ <span>Paramètres</span></a>
      </nav>
      <div class="profile">
        <div class="avatar">S</div>
        <div>
          <b>Sayan</b>
          <small>Compte local</small>
        </div>
      </div>
    </aside>

    <main>
      <header>
        <div>
          <p class="eyebrow">ESPACE DE JEU</p>
          <h1>{{ installing ? 'Installation en cours' : 'Prêt pour une nouvelle aventure' }}</h1>
          <p class="muted">{{ installing ? 'Aurora s’occupe des dépendances en arrière-plan.' : 'Une expérience Minecraft plus claire, plus rapide, plus belle.' }}</p>
        </div>
        <button class="ghost">☼</button>
      </header>

      <section v-if="!installing" class="hero">
        <div>
          <span class="pill">✦ NOUVEAU</span>
          <h2>Votre prochaine<br><em>dimension</em> vous attend.</h2>
          <p>Les mods manquants ne bloquent plus votre partie. Aurora les retrouve, les vérifie et les installe automatiquement.</p>
          <button class="primary" @click="install">Installer le pack démo <span>→</span></button>
        </div>
        <div class="planet">
          <div class="ring"></div>
          <div class="core">✦</div>
        </div>
      </section>

      <section v-else class="install">
        <div class="install-top">
          <div>
            <span class="pill">INSTALLATION AUTOMATIQUE</span>
            <h2>{{ progress.packName }}</h2>
          </div>
          <strong>{{ percent }}%</strong>
        </div>
        <div class="bar"><i :style="{ width: percent + '%' }"></i></div>

        <div v-if="missing.length" class="auto">
          <span>✦</span>
          <div>
            <b>Mods manquants récupérés automatiquement</b>
            <small>Recherche Modrinth en cours, avec repli CurseForge si nécessaire.</small>
          </div>
        </div>

        <div class="mod-list">
          <div v-for="m in progress.mods" :key="m.id" class="mod">
            <div class="mod-icon">{{ m.status === 'ok' ? '✓' : m.status === 'failed' ? '!' : '◌' }}</div>
            <div class="mod-info">
              <b>{{ m.name }}</b>
              <small>{{ m.message || m.status }}</small>
            </div>
            <div class="status" :class="m.status">{{ m.status === 'ok' ? 'Installé' : m.status === 'failed' ? 'Échec' : m.status === 'downloading' ? m.progress + '%' : 'Recherche...' }}</div>
          </div>
        </div>

        <button v-if="percent === 100" class="primary" @click="install">Réessayer l’installation <span>↻</span></button>
      </section>

      <footer>
        <span>◈ Aurora Launcher <small>v0.1.0</small></span>
        <span>Modrinth · CurseForge fallback</span>
      </footer>
    </main>
  </div>
</template>
