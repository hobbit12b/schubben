// Visual regression views, including an inspection view of all scale anchor points.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const server = require('../server.cjs');
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, hasTouch: true });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(() => !document.getElementById('start').disabled);
    const output = path.join(__dirname, 'artifacts');
    fs.mkdirSync(output, { recursive: true });
    await page.screenshot({ path: path.join(output, 'settings.png') });
    for (const max of [5, 10, 12, 20]) {
      await page.locator(`input[value="${max}"]`).check();
      await page.locator('#start').tap();
      await page.evaluate(n => { for (let i = 0; i < n; i++) document.getElementById('shell').click(); }, max);
      await page.evaluate(() => Promise.all(document.getElementById('fish-layer').getAnimations({ subtree: true }).filter(a => a.effect.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
      // Check each face against the actual foreground alpha, including edge slots.
      const visible = await page.evaluate(() => {
        const image = document.querySelector('.foreground');
        const rect = image.getBoundingClientRect();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return [...document.querySelectorAll('.fish')].every(fish => {
          const box = fish.getBoundingClientRect();
          const direction = Number(fish.style.getPropertyValue('--direction'));
          return [.35, .45, .55].every(y => [.45, .6, .75].every(x => {
            const px = (box.x + box.width * (direction === 1 ? x : 1 - x) - rect.x) / rect.width * canvas.width;
            const py = (box.y + box.height * y - rect.y) / rect.height * canvas.height;
            return py < 0 || context.getImageData(Math.floor(px), Math.floor(py), 1, 1).data[3] < 16;
          }));
        });
      });
      assert.equal(visible, true, `Foreground overlaps a face at level ${max}`);
      await page.screenshot({ path: path.join(output, `level-${max}.png`) });
      if (max === 5) await page.locator('.fish').first().screenshot({ path: path.join(output, 'yellow-eye.png'), scale: 'css' });
      if (max === 20) {
        await page.locator('.fish').evaluateAll(els => els.forEach(el => el.classList.add('counting')));
        await page.screenshot({ path: path.join(output, 'scale-anchors.png') });
      }
      await page.locator('#home').tap();
      console.log(`Layout ${max}: faces visible, screenshot saved`);
    }
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
