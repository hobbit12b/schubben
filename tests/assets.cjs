const sharp = require('sharp');
const assert = require('node:assert/strict');
(async () => {
  const { data, info } = await sharp('assets/approved/fish-yellow-body.webp').raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.channels, 4);
  for (const [x, y] of [[136, 83], [138, 85], [95, 104]]) {
    const [r, g, b, a] = data.subarray((y * info.width + x) * 4, (y * info.width + x) * 4 + 4);
    assert.equal(a, 255, `Eye white at ${x},${y} must not show the sea through it`);
    assert.ok(Math.min(r, g, b) > 235 && Math.max(r, g, b) - Math.min(r, g, b) < 8);
  }
  assert.equal(data[3], 0, 'The background must remain transparent');
  for (const state of ['closed', 'open']) {
    const metadata = await sharp(`assets/approved/shell-${state}.webp`).metadata();
    assert.deepEqual([metadata.width, metadata.height, metadata.hasAlpha], [450, 450, true]);
  }
  console.log('PASS: both yellow eye whites opaque and neutral; background transparent; shell canvases aligned.');
})();
