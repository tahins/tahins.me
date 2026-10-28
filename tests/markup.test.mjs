import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countH1,
  findEmptyHrefs,
  findImgsMissingAlt,
} from '../scripts/lib/markup-checks.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

test('markup helpers catch missing alt, empty hrefs, and H1 counts', () => {
  assert.deepEqual(findImgsMissingAlt('<img src="/x.jpg">'), ['<img src="/x.jpg">']);
  assert.deepEqual(findImgsMissingAlt('<img src="/x.jpg" alt="">'), []);
  assert.deepEqual(findImgsMissingAlt('<Picture src={x} alt="Portrait">'), []);
  assert.deepEqual(findEmptyHrefs('<a id="contact">'), ['<a id="contact">']);
  assert.deepEqual(findEmptyHrefs('<a href="">'), ['<a href="">']);
  assert.deepEqual(findEmptyHrefs('<a href="/blog/">'), []);
  assert.equal(countH1('<h1>One</h1><h2>Two</h2>'), 1);
  assert.equal(countH1('<h1>One</h1><h1>Two</h1>'), 2);
});

test('source pages give every img/Picture an alt and every anchor an href', async () => {
  const files = (await walk(path.join(root, 'src'))).filter((file) =>
    /\.(astro|md|mdx|html)$/.test(file),
  );
  const missingAlt = [];
  const emptyHrefs = [];
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const rel = path.relative(root, file);
    for (const tag of findImgsMissingAlt(text)) missingAlt.push({ file: rel, tag });
    for (const tag of findEmptyHrefs(text)) emptyHrefs.push({ file: rel, tag });
  }
  assert.deepEqual(missingAlt, []);
  assert.deepEqual(emptyHrefs, []);
});

test('built HTML has one H1, img alts, and no empty hrefs', async (t) => {
  const dist = path.join(root, 'dist');
  if (!(await exists(dist))) {
    t.skip('dist/ not built yet');
    return;
  }
  const files = (await walk(dist)).filter((file) => file.endsWith('.html'));
  assert.ok(files.length > 0, 'expected built HTML');
  const issues = [];
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const rel = path.relative(dist, file);
    const h1s = countH1(html);
    if (h1s !== 1) issues.push(`${rel} has ${h1s} h1s`);
    for (const tag of findImgsMissingAlt(html)) issues.push(`${rel} missing alt: ${tag}`);
    for (const tag of findEmptyHrefs(html)) issues.push(`${rel} empty href: ${tag}`);
  }
  assert.deepEqual(issues, []);
});
