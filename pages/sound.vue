<template>
  <main class="page">
    <section class="panel">
      <header class="header">
        <h1 class="title">サウンド設定</h1>
        <button type="button" class="backButton" aria-label="戻る" @click="router.push('/settings')">
          <img src="/arrow_back.svg" alt="" width="22" height="22" />
        </button>
      </header>

      <div class="toggleList">
        <div class="toggleRow">
          <div>
            <p class="toggleTitle">SE</p>
            <p class="toggleDesc">効果音のオン・オフ</p>
          </div>
          <label class="switch">
            <input type="checkbox" :checked="seEnabled" @change="toggleSe" />
            <span class="slider" />
          </label>
        </div>

        <div class="toggleRow">
          <div>
            <p class="toggleTitle">BGM</p>
            <p class="toggleDesc">BGMのオン・オフ</p>
          </div>
          <label class="switch">
            <input type="checkbox" :checked="bgmEnabled" @change="toggleBgm" />
            <span class="slider" />
          </label>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { loadSoundConfig, saveSoundConfig } from "~/utils/soundConfig";

const router = useRouter();
const seEnabled = ref(true);
const bgmEnabled = ref(true);

onMounted(() => {
  const config = loadSoundConfig();
  seEnabled.value = config.seEnabled;
  bgmEnabled.value = config.bgmEnabled;
});

watch([seEnabled, bgmEnabled], () => {
  saveSoundConfig({ seEnabled: seEnabled.value, bgmEnabled: bgmEnabled.value });
});

const toggleSe = (event: Event) => {
  seEnabled.value = (event.target as HTMLInputElement).checked;
};

const toggleBgm = (event: Event) => {
  bgmEnabled.value = (event.target as HTMLInputElement).checked;
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24px;
  --theme-main: #f97316;
  background: linear-gradient(160deg, var(--bg-1), var(--bg-2) 45%, var(--bg-3));
  position: relative;
  overflow: hidden;
}

.panel {
  width: min(720px, 100%);
  margin-inline: auto;
  border-radius: 26px;
  border: 1px solid var(--panel-border);
  background: var(--panel-surface);
  box-shadow: var(--panel-shadow-soft);
  padding: clamp(16px, 3vw, 32px);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(18px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.title {
  font-size: clamp(1.7rem, 5vw, 2.5rem);
  color: var(--text-primary);
  font-weight: 900;
  letter-spacing: 0.01em;
}

.backButton {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid var(--chip-border);
  background: var(--chip-bg);
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: var(--shadow-light);
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.backButton:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-strong);
}

.toggleList {
  margin-top: 24px;
  display: grid;
  gap: 16px;
}

.toggleRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--panel-border), transparent 35%);
  background: linear-gradient(140deg, var(--surface-1), var(--surface-2) 45%, var(--surface-1));
  box-shadow: var(--shadow-med);
}

.toggleTitle {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.toggleDesc {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.switch {
  position: relative;
  display: inline-block;
  width: 54px;
  height: 30px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: color-mix(in srgb, var(--panel-border), transparent 55%);
  border-radius: 999px;
  transition: background 160ms ease;
}

.slider::before {
  content: "";
  position: absolute;
  height: 22px;
  width: 22px;
  left: 4px;
  top: 4px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 8px 18px #0f172a26;
  transition: transform 160ms ease;
}

.switch input:checked + .slider {
  background: color-mix(in srgb, var(--theme-main), #0b1020 35%);
}

.switch input:checked + .slider::before {
  transform: translateX(24px);
}

@media (max-width: 640px) {
  .page {
    padding: 16px;
  }

  .panel {
    padding: 16px;
  }
}
</style>
