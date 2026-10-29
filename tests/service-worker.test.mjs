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

function headerBlocks(toml) {
  return toml.split(/\[\[headers\]\]/).slice(1);
}

function headerFor(toml, glob) {
  const escaped = glob.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return headerBlocks(toml).find((block) => new RegExp(`for\\s*=\\s*"${escaped}"`).test(block));
}

test('unregistering worker is shipped at /service-worker.js', async () => {
  const source = await readFile(path.join(root, 'public/service-worker.js'), 'utf8');
  assert.match(source, /self\.registration\.unregister/);
  assert.match(source, /caches\.delete/);
  assert.match(source, /skipWaiting/);
  assert.match(source, /\/service-worker\.js/);
});

test('build output keeps /service-worker.js and its netlify.toml headers', async (t) => {
  const netlify = await readFile(path.join(root, 'netlify.toml'), 'utf8');
  const headers = headerFor(netlify, '/service-worker.js');
  assert.ok(headers, 'missing [[headers]] for /service-worker.js');
  assert.match(headers, /Cache-Control\s*=\s*"no-cache, no-store, must-revalidate"/);
  assert.match(headers, /Service-Worker-Allowed\s*=\s*"\/"/);

  const distWorker = path.join(root, 'dist', 'service-worker.js');
  if (!(await exists(path.join(root, 'dist')))) {
    t.skip('dist/ not built yet');
    return;
  }
  assert.equal(await exists(distWorker), true, 'dist/service-worker.js should exist');
  const built = await readFile(distWorker, 'utf8');
  const source = await readFile(path.join(root, 'public/service-worker.js'), 'utf8');
  assert.equal(built, source);
});
