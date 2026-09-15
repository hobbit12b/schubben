const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const server = require('../server.cjs');
const fs = require('node:fs');
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, hasTouch: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(() => !document.getElementById('start').disabled);
    await page.evaluate(() => {
      window.previewVoices = [];
      const voice = gameSounds.voice;
      gameSounds.voice = name => { previewVoices.push(name); return voice(name); };
    });
    for (const mode of ['audio', 'both']) {
      await page.locator(`.mode-choice:has(input[value="${mode}"])`).tap();
      assert.equal(await page.evaluate(() => previewVoices.at(-1)), '03', 'Listening choices demonstrate the spoken number');
    }
    await page.locator('.mode-choice:has(input[value="visual"])').tap();
    assert.equal(await page.evaluate(() => previewVoices.length), 2, 'Seeing does not play the number');
    fs.mkdirSync('tests/artifacts', { recursive: true });
    await page.screenshot({ path: 'tests/artifacts/start-screen.png' });
    for (const viewport of [{ width: 1024, height: 768 }, { width: 820, height: 1180 }, { width: 1366, height: 768 }]) {
      await page.setViewportSize(viewport);
      assert.ok(await page.locator('#start').evaluate(el => {
        const button = el.getBoundingClientRect();
        const stage = document.querySelector('.stage').getBoundingClientRect();
        return button.bottom <= stage.bottom && button.top >= stage.top;
      }), 'Start button stays inside the game');
      for (const mode of ['visual', 'audio', 'both']) {
        await page.locator(`.mode-choice:has(input[value="${mode}"])`).tap();
        assert.equal(await page.locator('input[name="mode"]:checked').inputValue(), mode);
        assert.equal(await page.locator(`input[value="${mode}"] + span .selection-check`).evaluate(el => getComputedStyle(el).visibility), 'visible');
      }
    }
    await page.setViewportSize({ width: 1024, height: 768 });
    for (const mode of ['visual', 'audio', 'both']) {
      await page.locator(`.mode-choice:has(input[value="${mode}"])`).tap();
      await page.locator('#start').tap();
      assert.ok(await page.locator('#play').isVisible());
      assert.equal(await page.locator('#thought').isVisible(), mode !== 'audio');
      assert.equal(await page.locator('#speaker').isVisible(), mode !== 'visual');
      await page.locator('#home').tap();
    }
    assert.deepEqual(errors, []);
    console.log('PASS: illustrated choices, selection, viewport fit and all three game modes');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
