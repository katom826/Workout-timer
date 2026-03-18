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
          <p class="toggleTitle">SE</p>
          <label class="switch">
            <input type="checkbox" :checked="soundConfig.seEnabled" @change="toggleSe" />
            <span class="slider" />
          </label>
        </div>

        <div class="toggleRow">
          <p class="toggleTitle">BGM</p>
          <label class="switch">
            <input type="checkbox" :checked="soundConfig.bgmEnabled" @change="toggleBgm" />
            <span class="slider" />
          </label>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { soundConfig } from "~/utils/sound";

const router = useRouter();

const toggleSe = (event: Event) => {
  soundConfig.value.seEnabled = (event.target as HTMLInputElement).checked;
};

const toggleBgm = (event: Event) => {
  soundConfig.value.bgmEnabled = (event.target as HTMLInputElement).checked;
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: clamp(16px, 3vw, 24px);
  --theme-main: #f97316;
  background: rgb(33, 33, 33);
  position: relative;
  overflow: hidden;
}

.panel {
  width: min(760px, 100%);
  margin-inline: auto;
  border-radius: 28px;
  background: rgb(48, 48, 48);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
  padding: clamp(20px, 4vw, 32px);
  position: relative;
  z-index: 1;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.title {
  font-size: 1.3rem;
  color: rgb(245, 245, 245);
  font-weight: 900;
  letter-spacing: 0.01em;
}

.backButton {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  background: transparent;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
  border: none;
  box-shadow: none;
  transition: transform 160ms ease, opacity 160ms ease;
}

.backButton:hover {
  transform: translateY(-1px);
  opacity: 0.8;
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
  background: rgb(66, 66, 66);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.toggleTitle {
  font-size: 1.1rem;
  font-weight: 800;
  color: rgb(245, 245, 245);
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
  background: rgb(82, 82, 82);
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
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.2);
  transition: transform 160ms ease;
}

.switch input:checked + .slider {
  background: var(--theme-main);
}

.switch input:checked + .slider::before {
  transform: translateX(24px);
}

@media (max-width: 640px) {
  .page {
    padding: 12px;
  }

  .panel {
    padding: 16px;
    border-radius: 24px;
  }
}
</style>
