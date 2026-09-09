const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const server = require('../server.cjs');
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(() => !document.getElementById('start').disabled);
    await page.locator('#start').click();
    await page.evaluate(() => {
      const shell = document.getElementById('shell');
      const target = Number(document.getElementById('target').textContent);
      for (let i = 0; i < (target === 1 ? 2 : 1); i++) shell.click();
    });
    await page.waitForFunction(() => !document.querySelector('.swimming'));
    // Record every rendered frame from the click through the sad-face transition.
    const visibility = await page.evaluate(async () => {
      const fish = document.querySelector('.fish');
      const original = fish.querySelector('.fish-art:not(.fish-sad-art)');
      const sad = fish.querySelector('.fish-sad-art');
      getComputedStyle(original).opacity;
      document.getElementById('rainbow').click();
      const samples = [];
      const start = performance.now();
      while (performance.now() - start < 350) {
        samples.push(Number(getComputedStyle(original).opacity) + Number(getComputedStyle(sad).opacity));
        await new Promise(requestAnimationFrame);
      }
      return samples;
    });
    assert.ok(visibility.length > 2 && visibility.every(opacity => opacity > .95), 'Clicking Rainbow never leaves both face layers invisible');
    await page.locator('#home').click();
    await page.locator('#start').click();
    await page.evaluate(() => { for (let i = 0; i < 5; i++) document.getElementById('shell').click(); });
    await page.waitForFunction(() => !document.querySelector('.swimming'));
    for (let removal = 0; removal < 3; removal++) {
      await page.locator('.fish').first().click();
      await page.waitForFunction(() => !!document.querySelector('.fish-turn-copy'));
      const samples = await page.evaluate(() => {
        const fish = document.querySelector('.turning');
        const layers = [fish.querySelector('.fish-body'), fish.querySelector('.fish-turn-copy')];
        const animations = layers.map(el => el.getAnimations()[0]);
        animations.forEach(a => a.pause());
        const results = [];
        for (let i = 0; i <= 100; i++) {
          animations.forEach(a => { a.currentTime = a.effect.getTiming().duration * i / 100; });
          const styles = layers.map(el => getComputedStyle(el));
          results.push({ opacity: styles.reduce((sum, s) => sum + Number(s.opacity), 0),
            areas: styles.map(s => { const m = new DOMMatrix(s.transform); return Math.abs(m.a * m.d - m.b * m.c); }) });
        }
        animations.forEach(a => a.play());
        return results;
      });
      assert.ok(samples.every(s => s.opacity > .99 && s.areas.every(area => area > .99)), 'Every sampled frame retains a full-width visible fish');
      await page.waitForFunction(() => !document.getElementById('rainbow').disabled);
      assert.equal(await page.locator('.fish-turn-copy').count(), 0);
    }
    await page.locator('#home').click();
    await page.locator('#start').click();
    const target = Number(await page.locator('#target').textContent());
    await page.evaluate(() => {
      window.countWords = [];
      window.voiceOrder = [];
      const voice = gameSounds.voice;
      gameSounds.voice = key => { voiceOrder.push(key); if (/^\d\d$/.test(key)) countWords.push(Number(key)); return voice(key); };
    });
    await page.evaluate(n => { for (let i = 0; i < n; i++) document.getElementById('shell').click(); }, target);
    await page.locator('#rainbow').click();
    await page.waitForFunction(() => !document.getElementById('rainbow').disabled, null, { timeout: 20000 });
    assert.deepEqual(await page.evaluate(() => countWords), Array.from({ length: target }, (_, i) => i + 1), 'Visual mode also plays every correct count recording');
    assert.deepEqual(await page.evaluate(() => voiceOrder), [...Array.from({ length: target }, (_, i) => String(i + 1).padStart(2, '0')), 'goed geteld'], 'The recorded reward follows all count words in visual mode');
    assert.deepEqual(errors, []);
    console.log('PASS: no zero-width frame in either direction, turn copies cleaned up, recorded counting on correct answers in visual mode.');
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
