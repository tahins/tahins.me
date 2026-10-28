import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const blogDir = path.join(root, 'src/content/blog');

const OWN_POST =
  /https?:\/\/(?:tahins\.medium\.com|medium\.com\/@tahins)\/[^\s)"']+/gi;

const ALLOWED = [
  /medium\.com\/u\//i,
  /medium\.com\/@saidur/i,
  /medium\.com\/@nazimuddaula/i,
];

function bodyOf(markdown) {
  return markdown.replace(/^---[\s\S]*?---\n/, '');
}

test('article bodies do not link to Tahin’s Medium posts', async () => {
  const files = (await readdir(blogDir)).filter((name) => name.endsWith('.md'));
  const hits = [];
  for (const name of files) {
    const body = bodyOf(await readFile(path.join(blogDir, name), 'utf8'));
    for (const match of body.matchAll(OWN_POST)) {
      const url = match[0];
      if (ALLOWED.some((pattern) => pattern.test(url))) continue;
      hits.push(`${name}: ${url}`);
    }
  }
  assert.deepEqual(hits, []);
});

test('originally-published Medium notes are gone', async () => {
  const files = (await readdir(blogDir)).filter((name) => name.endsWith('.md'));
  const hits = [];
  for (const name of files) {
    const body = bodyOf(await readFile(path.join(blogDir, name), 'utf8'));
    if (/originally published/i.test(body)) hits.push(name);
  }
  assert.deepEqual(hits, []);
});
