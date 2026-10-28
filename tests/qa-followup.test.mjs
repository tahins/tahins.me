import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

const page404 = await readFile(path.join(root, 'src/pages/404.astro'), 'utf8');
const manifest = JSON.parse(await readFile(path.join(root, 'public/manifest.json'), 'utf8'));

test('404 page uses the site chrome with Home and Blog links', () => {
  assert.match(page404, /<h1>Page not found<\/h1>/);
  assert.match(page404, /href="\/"/);
  assert.match(page404, /href="\/blog\/"/);
  assert.match(page404, /not-found-links/);
  assert.doesNotMatch(page404, /<Navbar/);
});

test('manifest restores the live maskable icons', async () => {
  const maskable = manifest.icons.filter((icon) => icon.purpose === 'maskable');
  assert.equal(maskable.length, 2);
  assert.deepEqual(
    maskable.map((icon) => icon.src).sort(),
    [
      './img/icons/android-chrome-maskable-192x192.png',
      './img/icons/android-chrome-maskable-512x512.png',
    ].sort(),
  );
  for (const icon of maskable) {
    const file = path.join(root, 'public', icon.src.replace(/^\.\//, ''));
    assert.equal(await exists(file), true, icon.src);
  }
});

test('built 404.html and maskable icons are in dist', async (t) => {
  const dist = path.join(root, 'dist');
  if (!(await exists(dist))) {
    t.skip('dist/ not built yet');
    return;
  }
  const html = await readFile(path.join(dist, '404.html'), 'utf8');
  assert.match(html, /<h1>Page not found<\/h1>/);
  assert.match(html, /href="\/"/);
  assert.match(html, /href="\/blog\/"/);
  assert.match(html, /<html lang="en">/);
  assert.equal(await exists(path.join(dist, 'img/icons/android-chrome-maskable-192x192.png')), true);
  assert.equal(await exists(path.join(dist, 'img/icons/android-chrome-maskable-512x512.png')), true);
  const builtManifest = JSON.parse(await readFile(path.join(dist, 'manifest.json'), 'utf8'));
  assert.equal(builtManifest.icons.filter((icon) => icon.purpose === 'maskable').length, 2);
});
