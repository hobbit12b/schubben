const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const server = require('../server.cjs');
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, hasTouch: true });
    // A failed asset request can be retried without trapping the teacher on setup.
    await page.route('**/fish-yellow-tail.webp', route => route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(() => document.getElementById('start').textContent === 'Afbeeldingen opnieuw laden');
    await page.unroute('**/fish-yellow-tail.webp');
    await page.locator('#start').tap();
    await page.waitForFunction(() => document.getElementById('start').textContent === 'Spelen');
    await page.locator('#start').tap();
    await page.evaluate(() => { for (let i = 0; i < 5; i++) document.getElementById('shell').click(); });
    await page.waitForFunction(() => !document.querySelector('.swimming'));
    await page.waitForTimeout(350);
    const gazeRight = await page.locator('.rainbow-eye.near').evaluate(el => parseFloat(el.style.getPropertyValue('--gaze-x')));
    assert.ok(gazeRight > 0, 'Gaze follows the newest fish on the right');
    await page.waitForFunction(previous => parseFloat(document.querySelector('.rainbow-eye.near').style.getPropertyValue('--gaze-x')) < previous - 2, gazeRight, { timeout: 6500 });
    await page.locator('.fish').first().tap();
    await page.waitForTimeout(250);
    assert.ok(await page.locator('.rainbow-eye.near').evaluate(el => parseFloat(el.style.getPropertyValue('--gaze-x')) > 0), 'Gaze returns to departing last fish');
    await page.waitForFunction(() => !document.getElementById('rainbow').disabled);
    await page.locator('#rainbow').tap();
    await page.waitForFunction(() => !!document.querySelector('.flying-scale'));
    assert.equal(await page.locator('.flying-scale').count(), 1);
    assert.equal(await page.locator('.counting').count(), 0);
    await page.locator('#home').tap();
    await page.waitForTimeout(650);
    assert.equal(await page.locator('.flying-scale').count(), 0);
    assert.equal(await page.locator('.fish').count(), 0);
    await page.locator('#start').tap();
    assert.equal(await page.locator('#rainbow').isEnabled(), true);
    assert.equal(await page.locator('.stage').evaluate(el => el.scrollTop), 0);
    assert.equal(await page.evaluate(() => scrollY), 0);
    console.log('PASS: asset retry, newest/departing/idle gaze, single scale flight, home cancellation, no scrolling.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
