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
  const voices = Object.fromEntries([
    ...Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(2, '0')).flatMap(n => [n, `${n}geven`]),
    'druk op schelp', 'goed geteld', 'nognietgenoegvisjesprobeernogeens', 'teveelvisjesprobeerhetnogeens', 'uitleg'
  ].map(name => [name, { url: `audio/voice/${name}.mp3`, volume: 1 }]));
  const music = new Audio('audio/achtergrondmuziek.mp3');
  music.loop = true;
  music.preload = 'metadata';
  music.volume = .1;
  let musicEnabled = true, musicActive = false, musicGain, finishVoice;
  const voiceAudio = new Audio('audio/voice/uitleg.mp3');
  let voiceGeneration = 0, useVoiceFallback = false;
  try { musicEnabled = localStorage.getItem('schubben-music') !== 'off'; } catch {}
  let faceDown = false, pageAway = false, windowAway = false;
  let orientationRequested = false;
  const canPlayMusic = () => musicEnabled && musicActive && !document.hidden && !pageAway && !windowAway && !faceDown;
  function syncMusicPlayback() {
    if (!canPlayMusic()) { music.pause(); return; }
    if (context && context.state !== 'running') void context.resume().catch(() => {});
    if (music.paused) void music.play().then(() => {
      if (!canPlayMusic()) music.pause();
    }).catch(() => {});
  }
  function enableOrientation() {
    const Orientation = window.DeviceOrientationEvent;
    if (!Orientation || orientationRequested) return;
    orientationRequested = true;
    if (typeof Orientation.requestPermission === 'function') {
      try { void Orientation.requestPermission().catch(() => {}); } catch {}
    }
  }
  window.addEventListener('deviceorientation', event => {
    if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    const up = Math.cos(event.beta * Math.PI / 180) * Math.cos(event.gamma * Math.PI / 180);
    // Hysteresis prevents repeated pause/resume when the tablet is tilted.
    const next = faceDown ? up < -.35 : up < -.75;
    if (next !== faceDown) { faceDown = next; syncMusicPlayback(); }
  });
  document.addEventListener('visibilitychange', syncMusicPlayback);
  window.addEventListener('blur', () => { windowAway = true; syncMusicPlayback(); });
  window.addEventListener('focus', () => { windowAway = false; syncMusicPlayback(); });
  window.addEventListener('pagehide', () => { pageAway = true; syncMusicPlayback(); });
  window.addEventListener('pageshow', () => { pageAway = false; windowAway = false; syncMusicPlayback(); });
  // Retry within a gesture if Safari has interrupted audio while backgrounded.
  document.addEventListener('pointerdown', syncMusicPlayback);
  document.addEventListener('keydown', syncMusicPlayback);
  function startMusic() {
    musicActive = true;
    syncMusicPlayback();
  }
  function stopMusic() { musicActive = false; music.pause(); }
  function toggleMusic() {
    musicEnabled = !musicEnabled;
    try { localStorage.setItem('schubben-music', musicEnabled ? 'on' : 'off'); } catch {}
    if (!musicEnabled) music.pause();
    else if (musicActive) startMusic();
    return musicEnabled;
  }
  function stopVoice() { if (finishVoice) finishVoice(true); }
  function voice(name) {
    stopVoice();
    const clip = voices[name];
    if (!clip) return Promise.resolve(false);
    return new Promise(resolve => {
      let source, timer, finished = false;
      const finish = success => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (source) { try { source.stop(); } catch {} source.disconnect(); }
        if (clip.audio) { clip.audio.pause(); clip.audio.onended = clip.audio.onerror = null; }
        if (finishVoice === finish) finishVoice = null;
        if (musicGain) musicGain.gain.value = .1;
        else music.volume = .1;
        resolve(success);
      };
      finishVoice = finish;
      if (musicGain) musicGain.gain.value = .045;
      else music.volume = .045;
      timer = setTimeout(() => finish(false), 15000);
      if (context && clip.buffer) {
        source = context.createBufferSource();
        source.buffer = clip.buffer;
        source.connect(context.destination);
        source.onended = () => finish(true);
        if (context.state === 'running') source.start();
        else void context.resume().then(() => { if (!finished) source.start(); }).catch(() => finish(false));
      } else if (clip.audio) {
        voiceGeneration++;
        clip.audio.src = clip.url;
        clip.audio.muted = false;
        clip.audio.currentTime = 0;
        clip.audio.onended = () => finish(true);
        clip.audio.onerror = () => finish(false);
        void clip.audio.play().catch(() => finish(false));
      } else finish(false);
    });
  }
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
    if (context) {
      musicGain = context.createGain();
      musicGain.gain.value = .1;
      music.volume = 1;
      context.createMediaElementSource(music).connect(musicGain).connect(context.destination);
    }
    loading = Promise.all([...Object.values(effects), ...Object.values(voices)].map(async effect => {
      if (context) {
        try {
          const response = await fetch(effect.url);
          if (!response.ok) throw new Error('Sound unavailable');
          effect.buffer = await context.decodeAudioData(await response.arrayBuffer());
          return;
        } catch { /* Keep the game usable if Web Audio decoding is unavailable. */ }
      }
      if (Object.values(voices).includes(effect)) { effect.audio = voiceAudio; useVoiceFallback = true; }
      else fallback(effect);
    }));
    return loading;
  }
  function unlock() {
    if (context && context.state !== 'running') void context.resume().catch(() => {});
    if (useVoiceFallback && !finishVoice) {
      const generation = ++voiceGeneration;
      voiceAudio.muted = true;
      void voiceAudio.play().then(() => {
        if (voiceGeneration !== generation) return;
        voiceAudio.pause(); voiceAudio.currentTime = 0; voiceAudio.muted = false;
      }).catch(() => { if (voiceGeneration === generation) voiceAudio.muted = false; });
    }
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
  window.gameSounds = { preload, unlock, play, stop, voice, stopVoice, startMusic, stopMusic, toggleMusic, enableOrientation, isMusicEnabled: () => musicEnabled };
})();
