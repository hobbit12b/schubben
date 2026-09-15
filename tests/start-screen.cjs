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
      window.explanations = []; window.speechCancels = 0;
      speechSynthesis.speak = utterance => explanations.push({ text: utterance.text, lang: utterance.lang, rate: Number(utterance.rate.toFixed(2)) });
      speechSynthesis.cancel = () => { speechCancels++; };
    });
    const expected = {
      visual: 'Je ziet steeds het cijfer, maar het wordt niet gezegd.',
      audio: 'Je hoort het cijfer, maar je ziet het niet.',
      both: 'Je ziet het cijfer en je hoort het ook.'
    };
    for (const mode of ['visual', 'audio', 'both', 'both']) {
      await page.locator(`.mode-choice:has(input[value="${mode}"])`).tap();
      assert.deepEqual(await page.evaluate(() => explanations.at(-1)), { text: expected[mode], lang: 'nl-NL', rate: .82 });
    }
    assert.equal(await page.evaluate(() => explanations.length), 4, 'Tapping the same choice repeats its explanation');
    for (const level of [5, 10, 12, 20]) {
      await page.locator(`.levels label:has(input[value="${level}"])`).tap();
      assert.equal(await page.evaluate(() => explanations.at(-1).text), `Je oefent nu met cijfers van 1 tot en met ${level}.`);
    }
    assert.equal(await page.evaluate(() => speechCancels), 8, 'Each selection interrupts the previous explanation');
    await page.locator('.levels label:has(input[value="5"])').tap();
    await page.locator('.mode-choice:has(input[value="visual"])').tap();
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
      const cancellations = await page.evaluate(() => speechCancels);
      await page.locator('#start').tap();
      assert.ok(await page.evaluate(() => speechCancels) > cancellations, 'Starting cancels the menu explanation');
      assert.ok(await page.locator('#play').isVisible());
      assert.equal(await page.locator('#thought').isVisible(), mode !== 'audio');
      assert.equal(await page.locator('#speaker').isVisible(), mode !== 'visual');
      await page.locator('#home').tap();
    }
    assert.deepEqual(errors, []);
    console.log('PASS: illustrated choices, selection, viewport fit and all three game modes');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
