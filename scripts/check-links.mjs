#!/usr/bin/env node
/**
 * Fail the build if dist HTML points at missing local files,
 * missing img alts, empty hrefs, or more than one H1.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  countH1,
  findContentImgsWithBlankAlt,
  findEmptyHrefs,
  findImgsMissingAlt,
  findUnsplashImgsMissingSize,
} from './lib/markup-checks.mjs';

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
const missingAlt = [];
const blankContentAlt = [];
const emptyHrefs = [];
const headingIssues = [];
const unsplashSizeIssues = [];

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const rel = path.relative(dist, file);
  if (MEDIUM_IMAGE_HOST.test(html)) {
    mediumHosts.push(rel);
  }
  const alts = findImgsMissingAlt(html);
  if (alts.length) missingAlt.push({ file: rel, tags: alts });
  const blankAlts = findContentImgsWithBlankAlt(html);
  if (blankAlts.length) blankContentAlt.push({ file: rel, tags: blankAlts });
  const hrefs = findEmptyHrefs(html);
  if (hrefs.length) emptyHrefs.push({ file: rel, tags: hrefs });
  const h1s = countH1(html);
  if (h1s !== 1) headingIssues.push({ file: rel, count: h1s });
  const unsized = findUnsplashImgsMissingSize(html);
  if (unsized.length) unsplashSizeIssues.push({ file: rel, tags: unsized });
  for (const target of localTargets(html)) {
    if (target.startsWith('/http')) continue;
    const ok = await Promise.any(distPathFor(target).map((candidate) => exists(candidate).then((yes) => (yes ? candidate : Promise.reject()))),).catch(() => null);
    if (!ok) {
      broken.push({ file: rel, target });
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
if (missingAlt.length) {
  console.error('Images missing alt:');
  for (const item of missingAlt) {
    console.error(`  ${item.file}: ${item.tags.join(' ')}`);
  }
  process.exitCode = 1;
}
if (blankContentAlt.length) {
  console.error('Content images with blank alt (mark decorative with role=presentation):');
  for (const item of blankContentAlt) {
    console.error(`  ${item.file}: ${item.tags.join(' ')}`);
  }
  process.exitCode = 1;
}
if (emptyHrefs.length) {
  console.error('Empty or missing hrefs:');
  for (const item of emptyHrefs) {
    console.error(`  ${item.file}: ${item.tags.join(' ')}`);
  }
  process.exitCode = 1;
}
if (headingIssues.length) {
  console.error('Pages must have exactly one H1:');
  for (const item of headingIssues) {
    console.error(`  ${item.file}: ${item.count}`);
  }
  process.exitCode = 1;
}
if (unsplashSizeIssues.length) {
  console.error('Unsplash images must stay hotlinked with w=, fm=webp, and srcset:');
  for (const item of unsplashSizeIssues) {
    console.error(`  ${item.file}: ${item.tags.join(' ')}`);
  }
  process.exitCode = 1;
}
if (
  !broken.length &&
  !mediumHosts.length &&
  !missingAlt.length &&
  !blankContentAlt.length &&
  !emptyHrefs.length &&
  !headingIssues.length &&
  !unsplashSizeIssues.length
) {
  console.log(
    `Checked ${files.length} HTML files: links, alts, hrefs, H1s, Medium hosts, and Unsplash sizes look good.`,
  );
}
