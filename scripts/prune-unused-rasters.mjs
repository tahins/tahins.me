import { readdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const astro = path.join(dist, '_astro');

async function walkHtml(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walkHtml(full)));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const htmlFiles = await walkHtml(dist);
const used = new Set();
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/\/_astro\/([A-Za-z0-9._-]+\.(?:png|jpe?g|webp))/gi)) {
    used.add(match[1]);
  }
}

const rasters = (await readdir(astro)).filter((name) => /\.(png|jpe?g)$/i.test(name));
let removed = 0;
for (const name of rasters) {
  if (used.has(name)) continue;
  await unlink(path.join(astro, name));
  removed += 1;
}
console.log(`Pruned ${removed} unreferenced raster${removed === 1 ? '' : 's'} from dist/_astro`);
