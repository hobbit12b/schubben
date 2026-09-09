const sharp = require('sharp');
(async () => {
  const { data, info } = await sharp('assets/reference/fish-disappointed.webp').removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const seen = new Uint8Array(width * height), queue = [];
  function visit(i) {
    if (seen[i]) return;
    seen[i] = 1;
    const rgb = data.subarray(i * 3, i * 3 + 3);
    if (Math.min(...rgb) > 155 && Math.max(...rgb) - Math.min(...rgb) < 28) { seen[i] = 2; queue.push(i); }
  }
  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  for (let n = 0; n < queue.length; n++) {
    const i = queue[n], x = i % width;
    if (x) visit(i - 1); if (x < width - 1) visit(i + 1);
    if (i >= width) visit(i - width); if (i < width * (height - 1)) visit(i + width);
  }
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < seen.length; i++) { data.copy(rgba, i * 4, i * 3, i * 3 + 3); rgba[i * 4 + 3] = seen[i] === 2 ? 0 : 255; }
  for (const [index, color] of ['yellow', 'pink', 'turquoise', 'purple'].entries()) {
    const left = Math.round(index * width / 4);
    const cell = await sharp(rgba, { raw: { width, height, channels: 4 } })
      .extract({ left, top: 0, width: Math.round((index + 1) * width / 4) - left, height }).png().toBuffer();
    const sprite = await sharp(cell).trim().resize(145, 156, { fit: 'fill' }).png().toBuffer();
    const aligned = await sharp({ create: { width: 160, height: 267, channels: 4, background: '#00000000' } }).composite([{ input: sprite, left: 8, top: 35 }]).png().toBuffer();
    // Only use the generated mouth/brows. Keep the approved body, fins and opaque eyes unchanged.
    const mask = Buffer.from('<svg width="160" height="267"><ellipse cx="128" cy="106" rx="19" ry="15" fill="white"/><ellipse cx="89" cy="72" rx="20" ry="15" fill="white"/><ellipse cx="130" cy="61" rx="17" ry="10" fill="white"/></svg>');
    const expression = await sharp(aligned).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
    await sharp(`assets/approved/fish-${color}-body.webp`).composite([{ input: expression }]).webp({ lossless: true }).toFile(`assets/approved/fish-${color}-sad.webp`);
  }
})();

