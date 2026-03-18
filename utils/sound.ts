import { ref, watch } from "vue";

export type SoundConfig = {
  seEnabled: boolean;
  bgmEnabled: boolean;
};

export const SOUND_CONFIG_KEY = "sound-config-v1";

export const DEFAULT_SOUND_CONFIG: SoundConfig = {
  seEnabled: true,
  bgmEnabled: true
};

const normalizeSoundConfig = (config: Partial<SoundConfig>): SoundConfig => ({
  seEnabled: typeof config.seEnabled === "boolean" ? config.seEnabled : true,
  bgmEnabled: typeof config.bgmEnabled === "boolean" ? config.bgmEnabled : true
});

const loadSoundConfig = (): SoundConfig => {
  if (typeof window === "undefined") {
    return DEFAULT_SOUND_CONFIG;
  }

  const raw = localStorage.getItem(SOUND_CONFIG_KEY);
  if (!raw) {
    return DEFAULT_SOUND_CONFIG;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SoundConfig>;
    return normalizeSoundConfig(parsed);
  } catch {
    return DEFAULT_SOUND_CONFIG;
  }
};

export const soundConfig = ref<SoundConfig>(loadSoundConfig());

if (typeof window !== "undefined") {
  watch(
    soundConfig,
    (config) => {
      localStorage.setItem(SOUND_CONFIG_KEY, JSON.stringify(normalizeSoundConfig(config)));
    },
    { deep: true }
  );

  window.addEventListener("storage", (event) => {
    if (event.key === SOUND_CONFIG_KEY) {
      soundConfig.value = loadSoundConfig();
    }
  });
}
