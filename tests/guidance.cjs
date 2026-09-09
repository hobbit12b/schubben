const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const server = require('../server.cjs');
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    // Keep the level-ten target above one so the overlap assertion has two fish.
    await page.addInitScript(() => { Math.random = () => .5; });
    await page.addInitScript(() => {
      window.spoken = [];
      let timer;
      window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
      Object.defineProperty(window, 'speechSynthesis', { value: {
        getVoices: () => [{ lang: 'nl-NL' }],
        cancel: () => clearTimeout(timer),
        speak: utterance => { spoken.push(utterance.text); timer = setTimeout(() => utterance.onend?.(), 30); }
      } });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(() => !document.getElementById('start').disabled);
    await page.evaluate(() => { gameSounds.voice = async () => false; });
    await page.locator('#start').click();
    assert.deepEqual(await page.evaluate(() => spoken), ['Druk op Regenboog als er genoeg visjes in beeld staan.']);
    const normalTop = await page.locator('#rainbow').evaluate(el => el.getBoundingClientRect().top);
    await page.waitForFunction(() => document.getElementById('shell').classList.contains('hint'), null, { timeout: 10000 });
    await page.screenshot({ path: 'tests/artifacts/shell-hint.png' });
    await page.locator('#shell').click();
    assert.equal(await page.locator('#shell').evaluate(el => el.classList.contains('hint')), false);
    await page.waitForFunction(() => !document.querySelector('.swimming'));
    const firstBob = await page.locator('.fish-float').evaluate(el => getComputedStyle(el).transform);
    await page.waitForTimeout(200);
    assert.notEqual(await page.locator('.fish-float').evaluate(el => getComputedStyle(el).transform), firstBob);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.fish-float').evaluate(el => getComputedStyle(el).animationName), 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const parkedTop = await page.locator('.fish').evaluate(el => el.style.top);
    await page.locator('.fish').click();
    await page.waitForFunction(() => document.querySelector('.fish.turning'));
    await page.locator('.fish-body').evaluate(el => { const turn = el.getAnimations()[0]; turn.pause(); turn.currentTime = 45; });
    const firstTurn = await page.locator('.fish-body').evaluate(el => getComputedStyle(el).transform);
    assert.equal(await page.locator('.fish').evaluate(el => el.style.top), parkedTop);
    await page.locator('.fish-body').evaluate(el => { el.getAnimations()[0].currentTime = 110; });
    const secondTurn = await page.locator('.fish-body').evaluate(el => getComputedStyle(el).transform);
    assert.notEqual(firstTurn, secondTurn, 'Two different sideways frames precede descent');
    assert.equal(await page.locator('.fish').evaluate(el => el.style.top), parkedTop);
    await page.locator('.fish-body').evaluate(el => el.getAnimations()[0].play());
    await page.waitForFunction(() => !document.getElementById('rainbow').disabled);
    await page.locator('#home').click();
    await page.locator('input[value="10"]').check();
    await page.evaluate(() => { gameSounds.voice = async () => false; });
    await page.locator('#start').click();
    assert.equal(await page.evaluate(() => spoken.filter(t => t.startsWith('Druk op Regenboog')).length), 1, 'Intro only once per page opening');
    assert.ok(await page.locator('#rainbow').evaluate(el => el.getBoundingClientRect().top) < normalTop - 25);
    assert.ok(await page.evaluate(() => {
      const thought = document.getElementById('thought');
      const circleLeft = thought.getBoundingClientRect().left + parseFloat(getComputedStyle(thought, '::after').left);
      return circleLeft > document.getElementById('rainbow').getBoundingClientRect().right;
    }), 'Even the smallest thought bubble starts beside the fish');
    const target = Number(await page.locator('#target').textContent());
    const count = target;
    await page.evaluate(n => { for (let i = 0; i < n; i++) document.getElementById('shell').click(); }, count);
    await page.waitForFunction(() => !document.querySelector('.swimming'));
    await page.locator('#rainbow').click();
    await page.waitForFunction(() => document.querySelector('.fish.departing') && document.querySelector('.flying-scale'));
    await page.screenshot({ path: 'tests/artifacts/overlapping-count.png' });
    assert.equal(await page.locator('#thought').isDisabled(), true);
    assert.equal(await page.locator('#shell').evaluate(el => el.classList.contains('hint')), false);
    // Home must cancel both the departure and next scale flight together.
    await page.locator('#home').click();
    await page.waitForTimeout(450);
    assert.equal(await page.locator('.fish, .flying-scale').count(), 0);
    await page.evaluate(() => { gameSounds.voice = async () => false; });
    await page.locator('#start').click();
    const visibleText = await page.locator('#play').innerText();
    assert.match(visibleText.trim(), /^\d+$/, 'The playfield contains only the target number, no written instructions');
    const retryTarget = await page.locator('#target').textContent();
    await page.locator('#rainbow').click();
    await page.waitForFunction(() => document.getElementById('rainbow').classList.contains('sad'));
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.rainbow-sad')).opacity === '1');
    assert.equal(await page.locator('.rainbow-normal').evaluate(el => getComputedStyle(el).opacity), '1', 'Keep the original body visible, avoiding a sprite jump');
    assert.ok(await page.locator('.rainbow-expression').evaluate(el => getComputedStyle(el).maskImage.includes('rainbow.webp')), 'Clip expression to original fish silhouette');
    assert.equal(await page.locator('#rainbow').evaluate(el => getComputedStyle(el).animationName), 'shake-no');
    await page.screenshot({ path: 'tests/artifacts/wrong-answer.png' });
    await page.waitForFunction(() => !document.getElementById('rainbow').disabled);
    assert.equal(await page.locator('#target').textContent(), retryTarget);
    assert.equal(await page.locator('#rainbow').evaluate(el => el.classList.contains('sad')), false);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#rainbow').click();
    await page.waitForFunction(() => document.getElementById('rainbow').classList.contains('sad'));
    assert.equal(await page.locator('#rainbow').evaluate(el => getComputedStyle(el).animationName), 'none');
    await page.locator('#home').click();
    await page.evaluate(() => { gameSounds.voice = async () => false; });
    await page.locator('#start').click();
    assert.equal(await page.locator('#rainbow').evaluate(el => el.classList.contains('sad')), false);
    console.log('PASS: sad expression and no-shake on wrong answer, same target retry, normal expression restored, reduced motion and Home reset.');
    console.log('PASS: spoken intro once, idle hint/reset, subtle bob/reduced motion, level-10 spacing, overlapping departure/scale and Home cancellation, no playfield text.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });

