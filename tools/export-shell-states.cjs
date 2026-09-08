// Export the two ImageGen states on identical canvases without scenery.
const sharp = require('sharp');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
async function keyed(input) {
  const { data, info } = await sharp(path.join(root, input)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const seen = new Uint8Array(width * height), queue = [];
  function visit(i) {
    if (seen[i]) return;
    seen[i] = 1;
    const rgb = data.subarray(i * 3, i * 3 + 3);
    if (Math.min(...rgb) > 45 && Math.max(...rgb) - Math.min(...rgb) < 55) { seen[i] = 2; queue.push(i); }
  }
  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  for (let n = 0; n < queue.length; n++) {
    const i = queue[n], x = i % width;
    if (x) visit(i - 1);
    if (x < width - 1) visit(i + 1);
    if (i >= width) visit(i - width);
    if (i < width * (height - 1)) visit(i + width);
  }
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < seen.length; i++) {
    data.copy(rgba, i * 4, i * 3, i * 3 + 3);
    rgba[i * 4 + 3] = seen[i] === 2 ? 0 : 255;
  }
  return { rgba, width, height };
}
(async () => {
  const closed = await keyed('assets/reference/shell-states.png');
  const closedCell = await sharp(closed.rgba, { raw: { width: closed.width, height: closed.height, channels: 4 } })
    .extract({ left: 0, top: 0, width: closed.width / 2, height: closed.height }).png().toBuffer();
  const open = await keyed('assets/reference/shell-open-corrected.png');
  const openCell = await sharp(open.rgba, { raw: { width: open.width, height: open.height, channels: 4 } }).png().toBuffer();
  for (const [state, cell, spriteHeight] of [['closed', closedCell, 260], ['open', openCell, 350]]) {
    const sprite = await sharp(cell).trim().resize(350, spriteHeight, { fit: 'fill' }).png().toBuffer();
    await sharp({ create: { width: 450, height: 450, channels: 4, background: '#00000000' } })
      .composite([{ input: sprite, left: 50, top: 380 - spriteHeight }]).webp({ lossless: true }).toFile(path.join(root, `assets/approved/shell-${state}.webp`));
  }
})();
