import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { findMediumImageHosts } from '../scripts/lib/medium-import.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const blogDir = path.join(root, 'src/content/blog');

test('findMediumImageHosts flags leftover Medium CDN URLs', () => {
  assert.deepEqual(
    findMediumImageHosts('ok https://images.unsplash.com/photo-1 and local ../../assets/blog/x/image-1.jpeg'),
    [],
  );
  assert.deepEqual(
    findMediumImageHosts('<img src="https://miro.medium.com/v2/resize:fit:1400/1*abc.jpeg">'),
    ['https://miro.medium.com/v2/resize:fit:1400/1*abc.jpeg'],
  );
  assert.ok(
    findMediumImageHosts('https://cdn-images-1.medium.com/max/800/0*abc.png').length,
  );
});

test('imported blog posts do not load images from a Medium host', async () => {
  const names = (await readdir(blogDir)).filter((name) => name.endsWith('.md') || name.endsWith('.mdx'));
  assert.ok(names.length > 0, 'expected imported blog posts');
  const leftovers = [];
  for (const name of names) {
    const text = await readFile(path.join(blogDir, name), 'utf8');
    for (const url of findMediumImageHosts(text)) {
      leftovers.push({ file: name, url });
    }
  }
  assert.deepEqual(leftovers, []);
});
