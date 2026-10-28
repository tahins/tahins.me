#!/usr/bin/env node
/**
 * Fail the build if dist HTML points at missing local files.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

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

function localTargets(html) {
  const matches = [];
  const pattern = /\b(?:href|src)=["'](\/[^"']+)["']/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const raw = match[1].split('#')[0].split('?')[0];
    if (!raw || raw === '/') continue;
    if (raw.startsWith('//')) continue;
    matches.push(raw);
  }
  return matches;
}

function distPathFor(urlPath) {
  const trimmed = urlPath.replace(/\/$/, '');
  const candidates = [
    path.join(dist, urlPath),
    path.join(dist, urlPath, 'index.html'),
    path.join(dist, `${trimmed}.html`),
    path.join(dist, trimmed, 'index.html'),
  ];
  return candidates;
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

const MEDIUM_IMAGE_HOST =
  /(?:cdn-images-\d+\.medium\.com|miro\.medium\.com)/i;

const files = (await walk(dist)).filter((file) => file.endsWith('.html'));
const broken = [];
const mediumHosts = [];

for (const file of files) {
  const html = await readFile(file, 'utf8');
  if (MEDIUM_IMAGE_HOST.test(html)) {
    mediumHosts.push(path.relative(dist, file));
  }
  for (const target of localTargets(html)) {
    if (target.startsWith('/http')) continue;
    const ok = await Promise.any(distPathFor(target).map((candidate) => exists(candidate).then((yes) => (yes ? candidate : Promise.reject()))),).catch(() => null);
    if (!ok) {
      broken.push({ file: path.relative(dist, file), target });
    }
  }
}

if (broken.length) {
  console.error('Broken internal links:');
  for (const item of broken) {
    console.error(`  ${item.file} -> ${item.target}`);
  }
  process.exitCode = 1;
}
if (mediumHosts.length) {
  console.error('Built pages still load images from a Medium host:');
  for (const file of mediumHosts) {
    console.error(`  ${file}`);
  }
  process.exitCode = 1;
}
if (!broken.length && !mediumHosts.length) {
  console.log(`Checked ${files.length} HTML files: no broken internal links or Medium-hosted images.`);
}
