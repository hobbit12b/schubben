'use strict';

// Decode effects once. Resume the audio context directly from the Start gesture,
// so later scale flights can play sounds on touch browsers as well.
(() => {
  const effects = {
    plop: { url: 'audio/plop.mp3', volume: .55 },
    glitter: { url: 'audio/glitter.mp3', volume: .35 }
  };
  let context;
  let loading;
  function fallback(effect) {
    effect.audio = new Audio(effect.url);
    effect.audio.preload = 'auto';
    effect.audio.volume = effect.volume;
    effect.generation = 0;
  }
  function preload() {
    if (loading) return loading;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext && location.protocol !== 'file:') {
      try { context = new AudioContext(); } catch { /* Native audio is available below. */ }
    }
    loading = Promise.all(Object.values(effects).map(async effect => {
      if (context) {
        try {
          const response = await fetch(effect.url);
          if (!response.ok) throw new Error('Sound unavailable');
          effect.buffer = await context.decodeAudioData(await response.arrayBuffer());
          return;
        } catch { /* Keep the game usable if Web Audio decoding is unavailable. */ }
      }
      fallback(effect);
    }));
    return loading;
  }
  function unlock() {
    if (context && context.state !== 'running') void context.resume().catch(() => {});
    for (const effect of Object.values(effects)) {
      if (!effect.audio) continue;
      const audio = effect.audio, generation = ++effect.generation;
      audio.muted = true;
      void audio.play().then(() => {
        if (generation !== effect.generation) return;
        audio.pause(); audio.currentTime = 0; audio.muted = false;
      }).catch(() => { audio.muted = false; });
    }
  }
  function stopEffect(effect) {
    if (effect.source) {
      try { effect.source.stop(); } catch { /* It may already have ended. */ }
      effect.source = null;
    }
    if (effect.audio) {
      effect.generation++;
      effect.audio.pause();
      try { effect.audio.currentTime = 0; } catch { /* Metadata may still be loading. */ }
      effect.audio.muted = false;
    }
  }
  function play(name) {
    const effect = effects[name];
    if (!effect) return;
    stopEffect(effect);
    if (context && effect.buffer) {
      if (context.state !== 'running') return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      gain.gain.value = effect.volume;
      source.buffer = effect.buffer;
      source.connect(gain).connect(context.destination);
      source.onended = () => {
        source.disconnect(); gain.disconnect();
        if (effect.source === source) effect.source = null;
      };
      effect.source = source;
      source.start();
    } else if (effect.audio) {
      effect.audio.volume = effect.volume;
      void effect.audio.play().catch(() => {});
    }
  }
  function stop() { Object.values(effects).forEach(stopEffect); }
  window.gameSounds = { preload, unlock, play, stop };
})();
