import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('unregistering worker is shipped at /service-worker.js', async () => {
  const source = await readFile(path.join(root, 'public/service-worker.js'), 'utf8');
  assert.match(source, /self\.registration\.unregister/);
  assert.match(source, /caches\.delete/);
  assert.match(source, /skipWaiting/);
  assert.match(source, /\/service-worker\.js/);
});

test('old Vue PWA registered the same /service-worker.js path', async () => {
  const { stdout: deletedAt } = await execFileAsync(
    'git',
    ['log', '-1', '--diff-filter=D', '--pretty=format:%H', '--', 'src/registerServiceWorker.js'],
    { cwd: root },
  );
  assert.ok(deletedAt.trim(), 'expected git history for the Vue service worker');
  const { stdout } = await execFileAsync(
    'git',
    ['show', `${deletedAt.trim()}^:src/registerServiceWorker.js`],
    { cwd: root },
  );
  assert.match(stdout, /\$\{process\.env\.BASE_URL\}service-worker\.js/);
});
