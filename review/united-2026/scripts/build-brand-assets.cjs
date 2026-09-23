/* Export separate search/share artwork without redrawing or overwriting the site logo.
 * Optional build dependency: @napi-rs/canvas 0.1.100. The delivered site is static.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const BLUE = '#012858';
const SOURCE = 'assets/images/logo-united-idiomas.png';
const sha = data => crypto.createHash('sha256').update(data).digest('hex');

async function main() {
  const original = fs.readFileSync(path.join(DIST, SOURCE));
  const originalHash = sha(original);
  const logo = await loadImage(original);
  if (logo.width !== 258 || logo.height !== 164) {
    throw new Error('Review the emblem crop before using a different logo source.');
  }
  const records = {};
  function canvas(width, height) {
    const surface = createCanvas(width, height);
    const ctx = surface.getContext('2d');
    ctx.fillStyle = BLUE;
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    return { surface, ctx };
  }
  function write(relative, bytes, dimensions) {
    const file = path.join(DIST, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, bytes);
    records[relative] = { bytes: bytes.length, sha256: sha(bytes), dimensions };
  }
  function emblem(size) {
    const { surface, ctx } = canvas(size, size);
    // Exact isolated emblem from the original PNG. This rectangle contains no
    // wordmark pixels; all three original white/pink components remain intact.
    const crop = { x: 76, y: 0, width: 49, height: 69 };
    const height = size * 0.72;
    const width = height * crop.width / crop.height;
    ctx.drawImage(logo, crop.x, crop.y, crop.width, crop.height,
      (size - width) / 2, (size - height) / 2, width, height);
    return surface.toBuffer('image/png');
  }
  write('assets/brand/favicon-192.png', emblem(192), [192, 192]);

  const sizes = [16, 32, 48, 64];
  const frames = sizes.map(emblem);
  const directory = Buffer.alloc(6 + sizes.length * 16);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(sizes.length, 4);
  let offset = directory.length;
  sizes.forEach((size, index) => {
    const entry = 6 + index * 16;
    directory[entry] = size;
    directory[entry + 1] = size;
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(frames[index].length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += frames[index].length;
  });
  write('favicon.ico', Buffer.concat([directory, ...frames]), sizes.map(s => [s, s]));

  const square = canvas(512, 512);
  const squareLogoWidth = 360;
  const squareLogoHeight = squareLogoWidth * logo.height / logo.width;
  square.ctx.drawImage(logo, (512 - squareLogoWidth) / 2,
    (512 - squareLogoHeight) / 2, squareLogoWidth, squareLogoHeight);
  write('assets/brand/united-logo-512.png', square.surface.toBuffer('image/png'), [512, 512]);

  const share = canvas(1200, 630);
  const shareLogoWidth = 400;
  const shareLogoHeight = shareLogoWidth * logo.height / logo.width;
  // Only the unchanged logo, centered inside both the wide and square crops.
  // Course benefits belong in the sharing title/description, not in this image.
  share.ctx.drawImage(logo, (1200 - shareLogoWidth) / 2,
    (630 - shareLogoHeight) / 2, shareLogoWidth, shareLogoHeight);
  write('assets/brand/united-share-1200x630.png', share.surface.toBuffer('image/png'), [1200, 630]);

  if (sha(fs.readFileSync(path.join(DIST, SOURCE))) !== originalHash) {
    throw new Error('The on-page source logo must remain unchanged.');
  }
  fs.writeFileSync(path.join(ROOT, 'seo/brand-assets.json'), JSON.stringify({
    source: SOURCE, source_sha256: originalHash,
    background: BLUE, artwork: 'Original logo only, centered; no tagline.',
    method: 'Original PNG composited into separate opaque canvases; no redraw. Site logo unchanged.',
    renderer: '@napi-rs/canvas 0.1.100', assets: records,
  }, null, 2) + '\n');
  console.log(JSON.stringify({ sourceUnchanged: true, assets: records }, null, 2));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
