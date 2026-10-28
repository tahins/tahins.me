import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('unregistering worker is shipped at /service-worker.js', async () => {
  const source = await readFile(path.join(root, 'public/service-worker.js'), 'utf8');
  assert.match(source, /self\.registration\.unregister/);
  assert.match(source, /caches\.delete/);
  assert.match(source, /skipWaiting/);
  assert.match(source, /\/service-worker\.js/);
});
