const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const server = require('../server.cjs');
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(() => document.getElementById('start').textContent === 'Spelen');
    await page.evaluate(() => {
      window.soundEvents = []; window.sourceStarts = []; window.sourceStops = 0;
      const play = gameSounds.play;
      gameSounds.play = name => { soundEvents.push({ name, flight: !!document.querySelector('.flying-scale'), received: !!document.querySelector('.has-scale') }); play(name); };
      const start = AudioBufferSourceNode.prototype.start, stop = AudioBufferSourceNode.prototype.stop;
      AudioBufferSourceNode.prototype.start = function (...args) { sourceStarts.push(this.buffer.duration); return start.apply(this, args); };
      AudioBufferSourceNode.prototype.stop = function (...args) { sourceStops++; return stop.apply(this, args); };
    });
    await page.locator('#start').click();
    await page.locator('#shell').click();
    await page.evaluate(() => { for (let i = 0; i < 8; i++) document.getElementById('shell').click(); });
    assert.equal(await page.evaluate(() => soundEvents.filter(event => event.name === 'plop').length), 5, 'Only accepted additions produce plop');
    assert.equal(await page.evaluate(() => sourceStarts.length), 5, 'Real decoded MP3 buffers play');
    assert.ok(await page.evaluate(() => sourceStarts.every(duration => duration > 0)));
    await page.locator('#rainbow').click();
    await page.waitForFunction(() => soundEvents.some(event => event.name === 'glitter'));
    assert.deepEqual(await page.evaluate(() => soundEvents.find(event => event.name === 'glitter')), { name: 'glitter', flight: true, received: false });
    const stops = await page.evaluate(() => sourceStops);
    await page.locator('#home').click();
    assert.ok(await page.evaluate(() => sourceStops) > stops, 'Home stops the active glitter sound');
    assert.deepEqual(errors, []);
    await page.close();
    const local = await browser.newPage();
    await local.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await local.waitForFunction(() => document.getElementById('start').textContent === 'Spelen');
    await local.evaluate(() => {
      window.localPlays = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (...args) { if (!this.muted) localPlays.push(this.src); return play.apply(this, args); };
    });
    await local.locator('#start').click();
    await local.locator('#shell').click();
    assert.ok(await local.evaluate(() => localPlays.some(src => src.endsWith('/audio/plop.mp3'))));
    await local.close();
    console.log('PASS: decoded sound effects, plop only on accepted add, glitter starts during flight, Home stops audio, direct-file fallback.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
