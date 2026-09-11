'use strict';

(() => {
  const $ = id => document.getElementById(id);
  const ui = Object.fromEntries(['settings', 'settings-form', 'play', 'target', 'thought', 'fish-layer', 'rainbow', 'shell', 'home', 'speaker', 'music', 'start', 'setup-message'].map(id => [id, $(id)]));
  const state = { mode: 'visual', max: 5, target: 1, fishStack: [], busy: false, deck: [], slots: [], session: 0, playing: false };
  const speechAvailable = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const pending = new Set();
  let stopSpeech = null;
  let speechGeneration = 0;
  let pressTimer;
  let assetsReady = false;
  let gazeTimer;
  let idleTimer;
  let introPlayed = false;
  let gazeFrame;
  let gazeFish = null;
  let gazePoint = { x: .5, y: .75 };
  const audioActive = () => state.mode !== 'visual';
  const alive = session => state.playing && state.session === session;

  // Slot direction is explicit, including the central slot in each row of five.
  function buildSlots(max) {
    const five = [1, 1, 1, -1, -1];
    const ten = [1, 1, 1, 1, 1, -1, -1, -1, -1, -1];
    const row = (xs, y, directions, width) => xs.map((x, i) => ({ x, y, direction: directions[i], width }));
    const xs5 = [23, 36.5, 50, 63.5, 77];
    const xs10 = [14, 22, 30, 38, 46, 54, 62, 70, 78, 86];
    switch (max) {
      case 5: return row(xs5, 46, five, 10.8);
      case 10: return [...row(xs5, 39, five, 9), ...row(xs5, 55, five, 9)];
      case 12: return [...row(xs10, 41, ten, 8.1), ...row([46, 54], 55, [1, -1], 8.1)];
      case 20: return [...row(xs10, 41, ten, 8.1), ...row(xs10, 55, ten, 8.1)];
      default: throw new Error('Onbekend niveau');
    }
  }

  function nextTarget() {
    if (!state.deck.length) {
      state.deck = Array.from({ length: state.max }, (_, i) => i + 1);
      for (let i = state.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
      }
    }
    return state.deck.pop();
  }

  function delay(ms) {
    return new Promise(resolve => {
      const cancel = () => { clearTimeout(timer); pending.delete(cancel); resolve(); };
      const timer = setTimeout(cancel, ms);
      pending.add(cancel);
    });
  }

  function cancelSpeech() {
    speechGeneration++;
    window.gameSounds.stopVoice();
    if (stopSpeech) stopSpeech();
    if (speechAvailable) window.speechSynthesis.cancel();
    ui.speaker.classList.remove('speaking');
  }

  async function speak(text, rate = .82, explicit = false, recording) {
    cancelSpeech();
    if (!explicit && !audioActive()) return;
    const session = state.session;
    const generation = speechGeneration;
    const key = recording || (/^\d+$/.test(text) ? text.padStart(2, '0') : text === instruction() ? `${String(state.target).padStart(2, '0')}geven` : text === 'Goed geteld!' ? 'goed geteld' : null);
    if (key) {
      ui.speaker.classList.add('speaking');
      const played = await window.gameSounds.voice(key);
      if (generation !== speechGeneration) return;
      ui.speaker.classList.remove('speaking');
      if (played || !alive(session)) return;
    }
    if (!speechAvailable) return;
    return new Promise(resolve => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'nl-NL';
      utterance.rate = rate;
      const voice = speechSynthesis.getVoices().find(v => v.lang.toLowerCase() === 'nl-nl');
      if (voice) utterance.voice = voice;
      let finished = false;
      let timer;
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (stopSpeech === finish) stopSpeech = null;
        ui.speaker.classList.remove('speaking');
        resolve();
      };
      stopSpeech = finish;
      utterance.onend = finish;
      utterance.onerror = () => {
        ui['setup-message'].textContent = 'Spraak kon niet worden afgespeeld. Controleer het geluid en de Nederlandse stem op dit apparaat.';
        finish();
      };
      // A missing Safari speech event must never leave the game locked.
      timer = setTimeout(() => { finish(); speechSynthesis.cancel(); }, Math.max(4500, text.length * 140));
      ui.speaker.classList.add('speaking');
      try { speechSynthesis.speak(utterance); } catch { finish(); }
    });
  }

  const instruction = () => `Regenboog wil aan ${state.target} visjes een schub geven.`;

  function resetIdleHint() {
    clearTimeout(idleTimer);
    ui.shell.classList.remove('hint');
    if (!state.playing || state.busy || ui.shell.disabled) return;
    idleTimer = setTimeout(() => {
      if (state.playing && !state.busy && !ui.shell.disabled) {
        ui.shell.classList.add('hint');
        if (!ui.speaker.classList.contains('speaking')) void speak('Druk op de schelp.', .82, true, 'druk op schelp');
      }
    }, 8000);
  }

  function scheduleIdleGaze() {
    clearTimeout(gazeTimer);
    gazeTimer = setTimeout(() => {
      if (!state.playing) return;
      if (!state.busy && state.fishStack.length) {
        const others = state.fishStack.filter(fish => fish !== gazeFish);
        const choices = others.length ? others : state.fishStack;
        gazeFish = choices[Math.floor(Math.random() * choices.length)];
      }
      scheduleIdleGaze();
    }, 3000 + Math.random() * 1200);
  }

  function lookAtFish(fish) {
    gazeFish = fish;
    scheduleIdleGaze();
  }

  function updateGaze() {
    if (!state.playing) return;
    const stage = document.querySelector('.stage').getBoundingClientRect();
    if (gazeFish?.el.isConnected) {
      const fish = gazeFish.el.getBoundingClientRect();
      gazePoint = { x: (fish.left + fish.width / 2 - stage.left) / stage.width, y: (fish.top + fish.height * .45 - stage.top) / stage.height };
    }
    for (const eye of ui.rainbow.querySelectorAll('.rainbow-eye')) {
      const rect = eye.getBoundingClientRect();
      const dx = gazePoint.x * stage.width + stage.left - rect.left - rect.width / 2;
      const dy = gazePoint.y * stage.height + stage.top - rect.top - rect.height / 2;
      const distance = Math.max(1, Math.hypot(dx, dy));
      eye.style.setProperty('--gaze-x', `${dx / distance * (eye.classList.contains('far') ? 14 : 25)}%`);
      eye.style.setProperty('--gaze-y', `${dy / distance * 20}%`);
    }
    gazeFrame = requestAnimationFrame(updateGaze);
  }

  function syncControls() {
    ui.rainbow.disabled = state.busy;
    ui.speaker.disabled = state.busy;
    ui.thought.disabled = state.busy;
    ui.shell.disabled = state.busy || state.fishStack.length >= state.max;
    for (const fish of state.fishStack) fish.el.disabled = state.busy;
    resetIdleHint();
  }

  function setupRound(retry = false, announce = true) {
    closeShell();
    ui.rainbow.classList.remove('happy', 'sad');
    if (!retry) state.target = nextTarget();
    ui.target.textContent = state.mode === 'audio' ? '' : String(state.target);
    ui.thought.hidden = state.mode === 'audio';
    ui.thought.setAttribute('aria-label', state.mode === 'audio' ? 'Beluister het getal' : `Beluister het getal ${state.target}`);
    state.busy = false;
    syncControls();
    if (announce) void speak(instruction());
  }

  function startGame(mode, max) {
    goHome();
    state.mode = mode;
    state.max = max;
    state.slots = buildSlots(max);
    state.deck = [];
    state.playing = true;
    ui.settings.hidden = true;
    ui.play.hidden = false;
    ui.play.classList.toggle('level-ten', max === 10);
    ui.speaker.hidden = !audioActive();
    setupRound(false, false);
    if (!introPlayed) {
      introPlayed = true;
      const session = state.session;
      const intro = speak('Druk op Regenboog als er genoeg visjes in beeld staan.', .82, true, 'uitleg');
      const generation = speechGeneration;
      void intro.then(() => {
        if (generation === speechGeneration && alive(session) && !state.busy && !state.fishStack.length) void speak(instruction());
      });
    } else void speak(instruction());
    updateGaze();
    scheduleIdleGaze();
  }

  function move(fish, from, to, duration) {
    fish.motion?.cancel();
    fish.el.style.top = `${to}%`;
    fish.motion = fish.el.animate([{ top: `${from}%` }, { top: `${to}%` }], { duration, easing: 'cubic-bezier(.2,.65,.3,1)' });
    return fish.motion.finished.catch(() => {});
  }

  function createFish(slot, index) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'fish swimming';
    el.setAttribute('aria-label', 'Stuur het laatste visje terug');
    el.style.left = `${slot.x - slot.width / 2}%`;
    el.style.setProperty('--fish-width', `${slot.width}%`);
    el.style.setProperty('--direction', slot.direction);
    const color = ['yellow', 'turquoise', 'pink', 'purple'][index % 4];
    el.style.setProperty('--tail-period', `${1650 + index % 7 * 130}ms`);
    el.style.setProperty('--tail-delay', `${-index * 370}ms`);
    el.style.setProperty('--bob-period', `${3600 + index % 5 * 310}ms`);
    el.style.setProperty('--bob-delay', `${-index * 590}ms`);
    const floating = document.createElement('span');
    floating.className = 'fish-float';
    const body = document.createElement('span');
    body.className = 'fish-body';
    const art = document.createElement('img');
    art.className = 'fish-art';
    art.src = `assets/approved/fish-${color}-body.webp`;
    art.alt = '';
    art.draggable = false;
    const sadArt = document.createElement('img');
    sadArt.className = 'fish-art fish-sad-art';
    sadArt.src = `assets/approved/fish-${color}-sad.webp`;
    sadArt.alt = '';
    sadArt.draggable = false;
    const tail = document.createElement('img');
    tail.className = 'fish-tail';
    tail.src = `assets/approved/fish-${color}-tail.webp`;
    tail.alt = '';
    tail.draggable = false;
    // The tail overlaps behind the rounded body at its fixed attachment point.
    body.append(tail, art, sadArt);
    const scale = document.createElement('span');
    scale.className = 'scale';
    body.append(scale);
    floating.append(body);
    el.append(floating);
    el.addEventListener('click', removeLastFish);
    ui['fish-layer'].append(el);
    const fish = { el, slot, motion: null, entering: null };
    fish.entering = move(fish, 108, slot.y, 520);
    fish.entering.then(() => el.classList.remove('swimming'));
    return fish;
  }

  function addFish() {
    if (!state.playing || state.busy || state.fishStack.length >= state.max) return;
    window.gameSounds.play('plop');
    clearTimeout(pressTimer);
    ui.shell.classList.add('pressed');
    pressTimer = setTimeout(() => ui.shell.classList.remove('pressed'), 100);
    const index = state.fishStack.length;
    const fish = createFish(state.slots[index], index);
    state.fishStack.push(fish);
    lookAtFish(fish);
    syncControls();
  }

  async function swimFishAway(fish, session, disappointed = false) {
    await fish.entering;
    if (!alive(session)) return;
    fish.el.classList.add('turning', 'swimming');
    fish.el.classList.remove('counting');
    fish.el.disabled = true;
    let turn, mirroredTurn, turnCopy;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const body = fish.el.querySelector('.fish-body');
      const direction = fish.slot.direction;
      // Never interpolate a scale from +1 to -1: its zero crossing hides the fish.
      // Crossfade two full-width poses instead, preserving the final direction.
      turnCopy = body.cloneNode(true);
      turnCopy.className = 'fish-turn-copy';
      turnCopy.setAttribute('aria-hidden', 'true');
      body.parentElement.append(turnCopy);
      const poses = [[0, 0], [70, .35], [110, .7], [180, 1]];
      const timing = { duration: disappointed ? 480 : 260, easing: 'ease-in-out', fill: 'forwards' };
      turn = body.animate(poses.map(([angle, offset]) => ({
        transform: `scaleX(${direction}) rotate(${angle}deg)`, opacity: offset === 1 ? 0 : 1, offset
      })), timing);
      mirroredTurn = turnCopy.animate(poses.map(([angle, offset]) => ({
        transform: `scaleX(${direction}) rotate(${angle}deg) scaleX(-1)`, opacity: offset === 1 ? 1 : 0, offset
      })), timing);
      await turn.finished.catch(() => {});
    }
    if (!alive(session)) { turnCopy?.remove(); return; }
    fish.el.classList.remove('turning');
    fish.el.classList.add('departing');
    turn?.cancel();
    mirroredTurn?.cancel();
    turnCopy?.remove();
    await move(fish, fish.slot.y, 108, disappointed ? 1250 : 300);
    if (alive(session)) {
      fish.el.remove();
    }
  }

  async function removeLastFish() {
    if (!state.playing || state.busy || !state.fishStack.length) return;
    window.gameSounds.play('plop');
    const session = state.session;
    const fish = state.fishStack.pop();
    lookAtFish(fish);
    // Reserve the board until departure finishes, so a new fish cannot overlap its slot.
    state.busy = true;
    fish.el.disabled = true;
    syncControls();
    await swimFishAway(fish, session);
    if (!alive(session)) return;
    state.busy = false;
    syncControls();
  }

  async function giveScaleToFish(fish, count, session, previousWord = Promise.resolve()) {
    if (!alive(session)) return;
    lookAtFish(fish);
    // Pause the subtle bob while the scale flies, keeping its destination fixed.
    fish.el.classList.add('receiving');
    const stage = document.querySelector('.stage').getBoundingClientRect();
    const rainbow = ui.rainbow.getBoundingClientRect();
    const destination = fish.el.querySelector('.scale').getBoundingClientRect();
    const scale = document.createElement('span');
    scale.className = 'flying-scale';
    scale.setAttribute('aria-hidden', 'true');
    scale.style.width = `${destination.width / stage.width * 100}%`;
    scale.style.height = `${destination.height / stage.height * 100}%`;
    ui.play.append(scale);
    window.gameSounds.play('glitter');
    const flight = scale.animate([
      { left: `${(rainbow.left + rainbow.width * .4 - stage.left) / stage.width * 100}%`, top: `${(rainbow.top + rainbow.height * .58 - stage.top) / stage.height * 100}%`, transform: 'scale(.8)' },
      { left: `${(destination.left - stage.left) / stage.width * 100}%`, top: `${(destination.top - stage.top) / stage.height * 100}%`, transform: 'scale(1)' }
    ], { duration: 520, easing: 'ease-in-out', fill: 'forwards' });
    await flight.finished.catch(() => {});
    scale.remove();
    if (!alive(session)) return;
    fish.el.classList.add('has-scale');
    await previousWord;
    if (!alive(session)) return;
    fish.el.classList.add('counting');
    const spoken = speak(String(count), .95, true);
    // Let speech finish during the turn/departure, without holding the fish still.
    await delay(60);
    return { spoken };
  }

  function openShell() { ui.shell.classList.add('open'); }
  function closeShell() { ui.shell.classList.remove('open'); }

  async function showCorrectReward(session) {
    ui.rainbow.classList.add('happy');
    await speak('Goed geteld!', .82, true);
    if (!alive(session)) return;
    openShell();
    await delay(1100);
    if (!alive(session)) return;
    closeShell();
    await delay(200);
  }

  async function checkAnswer() {
    if (!state.playing || state.busy) return;
    const session = state.session;
    state.busy = true;
    cancelSpeech();
    syncControls();
    const fishToCount = [...state.fishStack];
    const count = fishToCount.length;
    await Promise.all(fishToCount.map(fish => fish.entering));
    if (!alive(session)) return;
    const correct = count === state.target;
    if (!correct) {
      ui.rainbow.classList.add('sad');
      for (const fish of fishToCount) fish.el.classList.add('disappointed');
      await delay(450);
      const departures = [];
      for (let i = 0; i < count; i++) {
        if (!alive(session)) return;
        lookAtFish(fishToCount[i]);
        const spoken = speak(String(i + 1), .95);
        departures.push(swimFishAway(fishToCount[i], session, true));
        await Promise.all([spoken, delay(220)]);
      }
      await Promise.all(departures);
      if (!alive(session)) return;
      state.fishStack = [];
      await Promise.all([
        speak(count < state.target ? 'Nog niet genoeg visjes. Probeer het nog eens.' : 'Te veel visjes. Probeer het nog eens.', .82, true,
          count < state.target ? 'nognietgenoegvisjesprobeernogeens' : 'teveelvisjesprobeerhetnogeens'),
        delay(1400)
      ]);
      if (alive(session)) setupRound(true);
      return;
    }
    const departures = [];
    let previousWord = Promise.resolve();
    for (let i = 0; i < count; i++) {
      if (!alive(session)) return;
      const countSpeech = await giveScaleToFish(fishToCount[i], i + 1, session, previousWord);
      if (!alive(session)) return;
      previousWord = countSpeech.spoken;
      // Departure overlaps the next scale flight; spoken counts stay sequential.
      departures.push(swimFishAway(fishToCount[i], session));
    }
    await Promise.all([...departures, previousWord]);
    if (!alive(session)) return;
    window.gameSounds.stop();
    state.fishStack = [];
    await showCorrectReward(session);
    if (alive(session)) setupRound();
  }

  function goHome() {
    state.session++;
    state.playing = false;
    cancelSpeech();
    window.gameSounds.stop();
    window.gameSounds.stopMusic();
    for (const cancel of [...pending]) cancel();
    for (const animation of ui.play.getAnimations({ subtree: true })) animation.cancel();
    for (const scale of ui.play.querySelectorAll('.flying-scale')) scale.remove();
    clearTimeout(pressTimer);
    clearTimeout(gazeTimer);
    clearTimeout(idleTimer);
    cancelAnimationFrame(gazeFrame);
    gazeFish = null;
    gazePoint = { x: .5, y: .75 };
    ui['fish-layer'].replaceChildren();
    state.fishStack = [];
    state.busy = false;
    state.deck = [];
    ui.target.textContent = '';
    ui.shell.classList.remove('pressed', 'hint');
    closeShell();
    ui.rainbow.classList.remove('happy', 'sad');
    ui.play.hidden = true;
    ui.settings.hidden = false;
  }

  ui['settings-form'].addEventListener('submit', event => {
    event.preventDefault();
    if (ui.start.disabled) return;
    if (!assetsReady) { loadAssets(); return; }
    const form = new FormData(ui['settings-form']);
    window.gameSounds.unlock();
    window.gameSounds.enableOrientation();
    const root = document.documentElement;
    const fullscreen = root.requestFullscreen || root.webkitRequestFullscreen;
    if (fullscreen && !document.fullscreenElement && !document.webkitFullscreenElement) {
      try { Promise.resolve(fullscreen.call(root)).catch(() => {}); } catch {}
    }
    startGame(String(form.get('mode')), Number(form.get('level')));
    window.gameSounds.startMusic();
    syncMusic();
  });
  function syncMusic() {
    const enabled = window.gameSounds.isMusicEnabled();
    ui.music.setAttribute('aria-pressed', String(enabled));
    ui.music.setAttribute('aria-label', enabled ? 'Achtergrondmuziek uitzetten' : 'Achtergrondmuziek aanzetten');
  }
  ui.music.addEventListener('click', () => { window.gameSounds.toggleMusic(); syncMusic(); });
  syncMusic();
  ui.shell.addEventListener('click', addFish);
  ui.rainbow.addEventListener('click', checkAnswer);
  ui.home.addEventListener('click', goHome);
  ui.speaker.addEventListener('click', () => { if (!state.busy) void speak(instruction()); });
  ui.thought.addEventListener('click', () => {
    if (state.playing && !state.busy && state.mode !== 'audio') void speak(String(state.target), .95, true);
  });
  ui.play.addEventListener('pointerdown', resetIdleHint);
  ui.play.addEventListener('keydown', resetIdleHint);

  const assets = ['background.webp', 'foreground.webp', 'rainbow.webp', 'rainbow-sad.webp', 'shell-closed.webp', 'shell-open.webp',
    'shell-plant.webp', ...['yellow', 'turquoise', 'pink', 'purple'].flatMap(color => ['body', 'tail', 'sad'].map(part => `fish-${color}-${part}.webp`))
  ].map(name => `assets/approved/${name}`);
  function loadAssets() {
    ui.start.disabled = true;
    ui.start.textContent = 'Even laden…';
    Promise.all([window.gameSounds.preload(), ...assets.map(name => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = () => reject(new Error(name));
      img.src = name;
    }))]).then(() => {
      assetsReady = true;
      ui.start.disabled = false;
      ui.start.textContent = 'Spelen';
      if (speechAvailable) ui['setup-message'].textContent = '';
    }).catch(() => {
      assetsReady = false;
      ui.start.disabled = false;
      ui.start.textContent = 'Afbeeldingen opnieuw laden';
      ui['setup-message'].textContent = 'Een spelafbeelding kon niet worden geladen. Probeer het opnieuw.';
    });
  }
  loadAssets();
})();
