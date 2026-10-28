import { readdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'src/assets');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

async function rawPixels(input) {
  return sharp(input, { failOnError: false, unlimited: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

function samePixels(a, b) {
  return a.info.width === b.info.width
    && a.info.height === b.info.height
    && a.info.channels === b.info.channels
    && Buffer.compare(a.data, b.data) === 0;
}

async function optimize(file) {
  const before = (await stat(file)).size;
  const ext = path.extname(file).toLowerCase();
  const image = sharp(file, { failOnError: false, unlimited: true }).rotate();
  let encoded;
  if (ext === '.png') {
    encoded = await image.png({ compressionLevel: 9, effort: 10, palette: false }).toBuffer();
  } else {
    encoded = await image.jpeg({ quality: 100, optimiseCoding: true, mozjpeg: true }).toBuffer();
  }
  const originalPixels = await rawPixels(file);
  const encodedPixels = await rawPixels(encoded);
  if (!samePixels(originalPixels, encodedPixels)) {
    return { file, before, after: before, kept: false, reason: 'not-pixel-identical' };
  }
  if (encoded.length >= before) {
    return { file, before, after: before, kept: false, reason: 'not-smaller' };
  }
  await writeFile(file, encoded);
  return { file, before, after: encoded.length, kept: true, reason: 'rewritten' };
}

const files = (await walk(assets)).filter((file) => /\.(png|jpe?g)$/i.test(file));
const rows = [];
for (const file of files) {
  rows.push(await optimize(file));
}
for (const row of rows) {
  const rel = path.relative(root, row.file);
  const delta = row.after - row.before;
  console.log(
    `${rel}\t${row.before}\t${row.after}\t${delta}\t${row.reason}`,
  );
}
