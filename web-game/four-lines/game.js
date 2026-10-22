(function attachFourLinesGame(root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FourLinesGame = api;
  if (root.document) root.FourLinesGame.boot();
})(typeof globalThis === 'undefined' ? this : globalThis, function createGame(root) {
  const DEFAULT_SETTINGS = { locale: 'zh', effectsVolume: 0.55, musicVolume: 0.55 };
  const KEYS = {
    locale: 'fourLinesLocale',
    effectsVolume: 'fourLinesEffectsVolume',
    musicVolume: 'fourLinesMusicVolume',
  };

  function clampVolume(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return DEFAULT_SETTINGS.effectsVolume;
    return Math.max(0, Math.min(1, number));
  }

  function normalizeLocale(value) {
    return value === 'en' ? 'en' : 'zh';
  }

  function loadSettings(storage) {
    const source = storage || root.localStorage;
    if (!source) return { ...DEFAULT_SETTINGS };
    return {
      locale: normalizeLocale(source.getItem(KEYS.locale)),
      effectsVolume: clampVolume(source.getItem(KEYS.effectsVolume) ?? DEFAULT_SETTINGS.effectsVolume),
      musicVolume: clampVolume(source.getItem(KEYS.musicVolume) ?? DEFAULT_SETTINGS.musicVolume),
    };
  }

  function saveSettings(storage, settings) {
    const target = storage || root.localStorage;
    if (!target) return;
    target.setItem(KEYS.locale, normalizeLocale(settings.locale));
    target.setItem(KEYS.effectsVolume, String(clampVolume(settings.effectsVolume)));
    target.setItem(KEYS.musicVolume, String(clampVolume(settings.musicVolume)));
  }

  class AudioManager {
    constructor() {
      this.effectsVolume = DEFAULT_SETTINGS.effectsVolume;
      this.musicVolume = DEFAULT_SETTINGS.musicVolume;
      this.unlocked = false;
      this.music = this.createAudio('music.mp3', true);
      this.effects = {
        place: this.createAudio('place.wav'),
        move: this.createAudio('move.wav'),
        victory: this.createAudio('victory.wav'),
        defeat: this.createAudio('defeat.wav'),
      };
    }

    createAudio(file, loop = false) {
      if (typeof root.Audio !== 'function') return null;
      const audio = new root.Audio(`./assets/audio/${file}`);
      audio.loop = loop;
      audio.preload = 'auto';
      return audio;
    }

    setEffectsVolume(value) {
      this.effectsVolume = clampVolume(value);
      for (const audio of Object.values(this.effects)) if (audio) audio.volume = this.effectsVolume;
    }

    setMusicVolume(value) {
      this.musicVolume = clampVolume(value);
      if (this.music) this.music.volume = this.musicVolume;
    }

    async unlock() {
      this.unlocked = true;
      if (!this.music || this.musicVolume === 0) return;
      try {
        await this.music.play();
      } catch (_) {
        // The next user gesture can retry after a browser autoplay rejection.
      }
    }

    async playEffect(kind) {
      const source = this.effects[kind];
      if (!source || !this.unlocked || this.effectsVolume === 0) return;
      source.currentTime = 0;
      source.volume = this.effectsVolume;
      try { await source.play(); } catch (_) { /* Browser may still require a gesture. */ }
    }

    pause() {
      if (this.music) this.music.pause();
    }

    async resume() {
      if (!this.unlocked || !this.music || this.musicVolume === 0) return;
      try { await this.music.play(); } catch (_) { /* Ignore a transient browser policy error. */ }
    }
  }

  function boot() {
    // The controller is added in Task 4. Keep the shell inert until then.
    const settings = loadSettings();
    const effects = root.document.getElementById('effects-volume');
    const music = root.document.getElementById('music-volume');
    if (effects) effects.value = String(settings.effectsVolume);
    if (music) music.value = String(settings.musicVolume);
  }

  return {
    AudioManager,
    DEFAULT_SETTINGS,
    KEYS,
    boot,
    clampVolume,
    loadSettings,
    normalizeLocale,
    saveSettings,
  };
});
