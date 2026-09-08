// Export ImageGen artwork as transparent WebP assets. Semantic artwork edits are
// made with ImageGen; this step removes its production background and crops a cell.
const sharp = require('sharp');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

async function removeBackground(input, key) {
  const { data, info } = await sharp(path.join(root, input)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0, tail = 0;
  function visit(i) {
    if (visited[i]) return;
    visited[i] = 1;
    const offset = i * 3;
    if (key(data[offset], data[offset + 1], data[offset + 2])) {
      visited[i] = 2;
      queue[tail++] = i;
    }
  }
  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  while (head < tail) {
    const i = queue[head++], x = i % width;
    if (x) visit(i - 1);
    if (x < width - 1) visit(i + 1);
    if (i >= width) visit(i - width);
    if (i < total - width) visit(i + width);
  }
  const rgba = Buffer.alloc(total * 4);
  for (let i = 0; i < total; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = visited[i] === 2 ? 0 : 255;
  }
  return { rgba, width, height };
}

(async () => {
  const foreground = await removeBackground('assets/reference/foreground-keyed.png', (r, g, b) => r > 170 && b > 160 && g < 110);
  await sharp(foreground.rgba, { raw: { width: foreground.width, height: foreground.height, channels: 4 } })
    .resize(800, 600).webp({ lossless: true }).toFile(path.join(root, 'assets/approved/foreground.webp'));
  const fish = await removeBackground('assets/reference/fish-strip-eye-study.png', (r, g, b) => Math.min(r, g, b) > 185 && Math.max(r, g, b) - Math.min(r, g, b) < 24);
  const cell = fish.width / 5;
  if (!Number.isInteger(cell)) throw new Error('The source must contain five equal sprite cells.');
  await sharp(fish.rgba, { raw: { width: fish.width, height: fish.height, channels: 4 } })
    .extract({ left: cell, top: 0, width: cell, height: fish.height }).resize(320, 534).webp({ lossless: true }).toFile(path.join(root, 'assets/approved/fish-yellow.webp'));
  console.log('Exported foreground.webp and fish-yellow.webp with transparent backgrounds.');
})().catch(error => { console.error(error); process.exitCode = 1; });
