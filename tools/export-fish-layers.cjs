// Production export of the ImageGen atlas: remove the neutral backdrop, crop
// the eight separate sprites, and align them on matching transparent canvases.
const sharp = require('sharp');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
(async () => {
  const whiteEyes = process.argv.includes('--white-eyes');
  const { data, info } = await sharp(path.join(root, `assets/reference/${whiteEyes ? 'fish-yellow-white-eyes.png' : 'fish-layers.png'}`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const visited = new Uint8Array(width * height);
  const queue = [];
  // This white eye touches the white production backdrop. Preserve its actual
  // contour during flood fill, including the white catchlight in the pupil.
  const eyeContour = [[259,79],[267,79],[278,87],[286,98],[291,110],[292,119],[289,126],[283,129],[274,126],[267,118],[260,107],[256,94],[256,86]];
  function protectedEye(x, y) {
    if (!whiteEyes) return false;
    let inside = false;
    for (let i = 0, j = eyeContour.length - 1; i < eyeContour.length; j = i++) {
      const [xi, yi] = eyeContour[i], [xj, yj] = eyeContour[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function visit(i) {
    if (visited[i]) return;
    visited[i] = 1;
    if (protectedEye(i % width, Math.floor(i / width))) return;
    const rgb = data.subarray(i * 3, i * 3 + 3);
    if (Math.min(...rgb) > 185 && Math.max(...rgb) - Math.min(...rgb) < 28) {
      visited[i] = 2; queue.push(i);
    }
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
  for (let i = 0; i < visited.length; i++) {
    data.copy(rgba, i * 4, i * 3, i * 3 + 3);
    rgba[i * 4 + 3] = visited[i] === 2 ? 0 : 255;
  }
  const raw = { width, height, channels: 4 };
  const colors = whiteEyes ? ['yellow'] : ['yellow', 'pink', 'turquoise', 'purple'];
  for (const [index, color] of colors.entries()) {
    const left = Math.round(index * width / colors.length);
    const cellWidth = Math.round((index + 1) * width / colors.length) - left;
    for (const part of whiteEyes ? ['body'] : ['body', 'tail']) {
      const body = part === 'body';
      const cell = await sharp(rgba, { raw }).extract({ left, top: whiteEyes ? 0 : body ? 230 : 790, width: cellWidth, height: whiteEyes ? height : body ? 350 : 200 }).png().toBuffer();
      const sprite = await sharp(cell).trim().resize(body ? 145 : 78, body ? 156 : 70, { fit: 'fill' }).png().toBuffer();
      await sharp({ create: { width: 160, height: 267, channels: 4, background: '#00000000' } })
        .composite([{ input: sprite, left: body ? 8 : 41, top: body ? 35 : 167 }])
        .webp({ lossless: true }).toFile(path.join(root, `assets/approved/fish-${color}-${part}.webp`));
    }
  }
})();
