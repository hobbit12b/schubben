const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const server = require('../server.cjs');
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    await page.addInitScript(() => {
      window.words = []; window.cutWords = []; window.activeWord = null;
      let timer;
      window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
      Object.defineProperty(window, 'speechSynthesis', { value: {
        getVoices: () => [{ lang: 'nl-NL' }],
        cancel: () => { if (window.activeWord) window.cutWords.push(window.activeWord); window.activeWord = null; clearTimeout(timer); },
        speak: utterance => {
          const numeric = /^\d+$/.test(utterance.text);
          if (numeric) { window.activeWord = utterance.text; window.words.push(utterance.text); }
          timer = setTimeout(() => { window.activeWord = null; utterance.onend?.(); }, numeric ? 900 : 30);
        }
      } });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(() => !document.getElementById('start').disabled);
    await page.evaluate(() => { gameSounds.voice = async () => false; });
    await page.locator('input[value="both"]').check();
    await page.locator('#start').click();
    await page.evaluate(() => { document.getElementById('shell').click(); document.getElementById('shell').click(); });
    await page.waitForFunction(() => !document.querySelector('.swimming'));
    await page.locator('#rainbow').click();
    await page.waitForFunction(() => window.activeWord === '1' && document.querySelector('.turning, .departing'));
    await page.waitForFunction(() => !document.getElementById('rainbow').disabled, null, { timeout: 12000 });
    assert.deepEqual(await page.evaluate(() => window.words), ['1', '2']);
    assert.deepEqual(await page.evaluate(() => window.cutWords), []);
    console.log('PASS: fish turns while a long count word plays; both words finish in sequence without cancellation.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });

