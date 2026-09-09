const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const server = require('../server.cjs');
const output = path.join(__dirname, 'artifacts');
fs.mkdirSync(output, { recursive: true });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const engine = process.env.TEST_BROWSER === 'webkit' ? webkit : chromium;
  const browser = await engine.launch({ headless: true, ...(process.env.TEST_BROWSER === 'webkit' ? {} : { channel: 'msedge' }) });
  const results = [];

  async function pageFor(mode, max, viewport = { width: 1024, height: 768 }) {
    const page = await browser.newPage({ viewport, hasTouch: true });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.addInitScript(() => {
      window.spoken = [];
      window.cancelCalls = 0;
      let timer;
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
        getVoices: () => [{ lang: 'nl-NL' }],
        cancel: () => { window.cancelCalls++; clearTimeout(timer); },
        speak: utterance => {
          window.spoken.push({ text: utterance.text, lang: utterance.lang, rate: utterance.rate });
          timer = setTimeout(() => utterance.onend?.(), 30);
        }
      } });
      window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    });
    await page.goto(url);
    await page.locator('#start').waitFor({ state: 'visible' });
    await page.waitForFunction(() => !document.getElementById('start').disabled);
    await page.evaluate(() => { gameSounds.voice = async () => false; });
    await page.locator(`input[value="${mode}"]`).check();
    await page.locator(`input[value="${max}"]`).check();
    await page.locator('#start').tap();
    await page.waitForTimeout(100);
    return { page, errors };
  }

  async function add(page, count) {
    // Synchronous clicks also exercise maximum clamping before an animation ends.
    await page.evaluate(n => { for (let i = 0; i < n; i++) document.getElementById('shell').click(); }, count);
    await page.evaluate(() => Promise.all(document.getElementById('fish-layer').getAnimations({ subtree: true }).filter(animation => animation.effect.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))));
  }

  async function levelCase(mode, max) {
    const { page, errors } = await pageFor(mode, max);
    const expected = max === 5 ? [1, 1, 1, -1, -1] : max === 10 ? [1, 1, 1, -1, -1, 1, 1, 1, -1, -1] : [...Array(5).fill(1), ...Array(5).fill(-1), ...(max === 12 ? [1, -1] : [...Array(5).fill(1), ...Array(5).fill(-1)])];
    const target = await page.evaluate(() => Number(document.getElementById('target').textContent) || Number(window.spoken.find(u => /\d+/.test(u.text)).text.match(/\d+/)[0]));
    assert.equal(await page.locator('#speaker').isVisible(), mode !== 'visual');
    assert.equal(await page.locator('#thought').isVisible(), mode !== 'audio');
    if (mode === 'audio') assert.equal(await page.locator('#target').textContent(), '');
    if (mode !== 'audio') {
      await page.locator('#thought').tap();
      assert.equal(await page.evaluate(() => spoken.at(-1).text), String(target));
      assert.equal(await page.evaluate(() => spoken.at(-1).lang), 'nl-NL');
      await page.locator('#thought').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => spoken.at(-1).text), String(target));
      await page.keyboard.press('Space');
      assert.equal(await page.evaluate(() => spoken.at(-1).text), String(target));
      await page.evaluate(() => { spoken.length = 0; });
    }
    if (mode !== 'visual') {
      await page.locator('#speaker').tap();
      assert.equal(await page.evaluate(() => spoken.at(-1).text), `Regenboog wil aan ${target} visjes een schub geven.`);
    }
    assert.equal(await page.locator('.shell-stones').count(), 0);
    await page.locator('#shell').tap();
    await page.evaluate(() => Promise.all(document.getElementById('fish-layer').getAnimations({ subtree: true }).filter(a => a.effect.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
    assert.ok(await page.locator('.fish-art').first().evaluate(el => el.src.endsWith('-body.webp')));
    assert.equal(await page.locator('.fish-tail').count(), 1);
    const firstPosition = await page.locator('.fish').first().boundingBox();
    await add(page, max + 4);
    assert.equal(await page.locator('.fish').count(), max);
    assert.deepEqual(await page.locator('.fish').first().boundingBox(), firstPosition);
    assert.deepEqual(await page.locator('.fish').evaluateAll(els => els.map(el => Number(el.style.getPropertyValue('--direction')))), expected);
    assert.ok(await page.locator('.fish-art').evaluateAll(els => els.every(el => !el.src.includes('clown'))));
    assert.ok(await page.evaluate(() => Number(getComputedStyle(document.querySelector('.foreground')).zIndex) > Number(getComputedStyle(document.getElementById('fish-layer')).zIndex)));
    const tailAtRest = await page.locator('.fish-tail').first().evaluate(el => getComputedStyle(el).transform);
    await pause(170);
    assert.notEqual(await page.locator('.fish-tail').first().evaluate(el => getComputedStyle(el).transform), tailAtRest);
    assert.equal(await page.locator('.fish-art').first().evaluate(el => getComputedStyle(el).transform), 'none');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.fish-tail').first().evaluate(el => getComputedStyle(el).animationName), 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const before = await page.locator('.fish').evaluateAll(els => els.map(el => ({ left: el.style.left, top: el.style.top })));
    await page.locator('.fish').first().tap();
    await page.waitForFunction(() => !!document.querySelector('.fish.departing'));
    assert.ok((await page.locator('.fish').last().getAttribute('class')).includes('departing'));
    const matrix = await page.locator('.fish').last().locator('.fish-body').evaluate(el => getComputedStyle(el).transform);
    assert.ok(matrix.startsWith(`matrix(${expected.at(-1)}, 0, 0, -1,`), matrix);
    await page.waitForFunction(n => document.querySelectorAll('.fish').length === n, max - 1);
    assert.deepEqual(await page.locator('.fish').evaluateAll(els => els.map(el => ({ left: el.style.left, top: el.style.top }))), before.slice(0, -1));
    // Home must cancel even a just-started removal and allow a new round immediately.
    await page.locator('.fish').first().tap();
    await page.locator('#home').tap();
    await page.locator('#start').tap();
    await pause(700);
    assert.equal(await page.locator('.fish').count(), 0);
    assert.equal(await page.locator('#rainbow').isEnabled(), true);
    const currentTarget = await page.evaluate(() => Number(document.getElementById('target').textContent) || Number(window.spoken.at(-1).text.match(/\d+/)[0]));
    // Zero is always a wrong answer. It must retain the target and stay gentle.
    await page.locator('#rainbow').tap();
    assert.equal(await page.locator('#thought').isDisabled(), true);
    await page.waitForFunction(() => !document.getElementById('rainbow').disabled);
    if (mode !== 'visual') assert.ok(await page.evaluate(t => spoken.some(u => u.text === 'Nog niet genoeg visjes. Probeer het nog eens.'), currentTarget));
    if (mode !== 'audio') assert.equal(Number(await page.locator('#target').textContent()), currentTarget);
    // A nonzero wrong answer still counts every fish sequentially.
    const wrongCount = currentTarget === max ? max - 1 : max;
    await add(page, wrongCount);
    await page.evaluate(() => {
      window.countOrder = [];
      window.maxCounting = 0;
      const layer = document.getElementById('fish-layer');
      window.countObserver = new MutationObserver(() => {
        const counting = [...layer.querySelectorAll('.counting')];
        window.maxCounting = Math.max(window.maxCounting, counting.length);
        for (const el of counting) if (!window.countOrder.includes(el)) window.countOrder.push(el);
      });
      window.countObserver.observe(layer, { subtree: true, attributes: true, childList: true });
    });
    await page.locator('#rainbow').tap();
    await page.evaluate(() => { document.getElementById('shell').click(); document.getElementById('speaker').click(); });
    assert.equal(await page.locator('.fish').count(), wrongCount);
    await page.waitForFunction(() => !!document.querySelector('.disappointed'));
    assert.equal(await page.locator('.flying-scale, .has-scale').count(), 0);
    assert.equal(await page.locator('.counting').count(), 0);
    await page.waitForFunction(() => !document.getElementById('rainbow').disabled, null, { timeout: 60000 });
    assert.equal(await page.locator('.fish').count(), 0);
    assert.equal(await page.evaluate(() => maxCounting), 0);
    assert.equal(await page.evaluate(() => countOrder.length), 0);
    await page.evaluate(() => countObserver.disconnect());
    if (mode !== 'audio') assert.equal(Number(await page.locator('#target').textContent()), currentTarget);
    await add(page, currentTarget);
    await page.locator('#rainbow').tap();
    await page.waitForFunction(() => document.getElementById('shell').classList.contains('open'), null, { timeout: 60000 });
    assert.equal(await page.locator('.fish').count(), 0);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.shell-open')).opacity === '1');
    if (max === 20 && mode === 'both') await page.screenshot({ path: path.join(output, 'reward.png') });
    await page.waitForFunction(() => !document.getElementById('rainbow').disabled);
    assert.equal(await page.locator('#shell').evaluate(el => el.classList.contains('open')), false);
    if (mode === 'visual') assert.ok(await page.evaluate(() => spoken.every(u => !/^\d+$/.test(u.text))));
    else assert.ok(await page.evaluate(() => spoken.every(u => u.lang === 'nl-NL' && u.rate === (/^\d+$/.test(u.text) ? .95 : .82))));
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth), false);
    await add(page, max);
    if (mode === 'visual') await page.screenshot({ path: path.join(output, `level-${max}.png`) });
    await page.locator('#rainbow').tap();
    await pause(150);
    await page.locator('#home').tap();
    await pause(800);
    assert.equal(await page.locator('#settings').isVisible(), true);
    assert.equal(await page.locator('.fish').count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
    const result = { mode, max, passed: true };
    console.log(JSON.stringify(result));
    results.push(result);
  }

  try {
    for (const mode of ['visual', 'audio', 'both']) await Promise.all([5, 10, 12, 20].map(max => levelCase(mode, max)));
    const { page, errors } = await pageFor('visual', 5);
    // A complete shuffled deck visits every target once.
    const deck = [];
    for (let round = 0; round < 5; round++) {
      const target = Number(await page.locator('#target').textContent());
      deck.push(target);
      await add(page, target);
      await page.locator('#rainbow').tap();
      await page.waitForFunction(() => !document.getElementById('rainbow').disabled, null, { timeout: 20000 });
    }
    assert.deepEqual(deck.sort((a, b) => a - b), [1, 2, 3, 4, 5]);
    await page.locator('#home').tap();
    await page.screenshot({ path: path.join(output, 'settings.png') });
    for (const viewport of [{ width: 1366, height: 768 }, { width: 768, height: 1024 }, { width: 820, height: 1180 }]) {
      await page.setViewportSize(viewport);
      const bounds = await page.locator('.stage').boundingBox();
      assert.ok(Math.abs(bounds.width / bounds.height - 4 / 3) < .001);
      assert.ok(bounds.width <= viewport.width && bounds.height <= viewport.height);
    }
    assert.deepEqual(errors, []);
    await page.close();
    results.push({ deckAndResponsive: true });
    fs.writeFileSync(path.join(output, `results-${process.env.TEST_BROWSER || 'chromium'}.json`), JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
    server.close();
  }
}
run().catch(error => { console.error(error); server.close(); process.exitCode = 1; });

