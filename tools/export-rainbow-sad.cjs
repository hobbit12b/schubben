// Remove the neutral production backdrop, preserving the drawn expression.
const sharp = require('sharp');
(async () => {
  const { data, info } = await sharp('assets/reference/rainbow-sad.png').removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const seen = new Uint8Array(width * height), queue = [];
  function visit(i) {
    if (seen[i]) return;
    seen[i] = 1;
    const rgb = data.subarray(i * 3, i * 3 + 3);
    if (Math.min(...rgb) > 45 && Math.max(...rgb) - Math.min(...rgb) < 30) { seen[i] = 2; queue.push(i); }
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
  const mouth = await sharp('assets/reference/rainbow-sad-mouth.png').resize(95, 75).png().toBuffer();
  await sharp(rgba, { raw: { width, height, channels: 4 } }).resize(500, 500)
    .composite([{ input: mouth, left: 390, top: 280 }])
    .webp({ lossless: true }).toFile('assets/approved/rainbow-sad.webp');
})();
