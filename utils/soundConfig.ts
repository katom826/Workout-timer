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

export const loadSoundConfig = (): SoundConfig => {
  if (import.meta.server) {
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

export const saveSoundConfig = (config: SoundConfig): void => {
  if (import.meta.server) {
    return;
  }

  localStorage.setItem(SOUND_CONFIG_KEY, JSON.stringify(normalizeSoundConfig(config)));
  window.dispatchEvent(new CustomEvent("sound-config-updated"));
};
