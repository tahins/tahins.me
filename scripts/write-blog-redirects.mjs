#!/usr/bin/env node
/**
 * Write Netlify 301s for blog old_slugs into dist/_redirects.
 * Merges any existing public/_redirects lines. Do not use Astro redirects
 * (those emit meta-refresh HTML pages).
 */
import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBlogFrontmatter } from './lib/blog-frontmatter.mjs';
import { assertSlugs, netlifyRedirectLines } from '../src/lib/slugs.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distFile = path.join(root, 'dist/_redirects');
const publicFile = path.join(root, 'public/_redirects');

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

const posts = await loadBlogFrontmatter(path.join(root, 'src/content/blog'));
assertSlugs(posts);

const generated = netlifyRedirectLines(posts);
const header = '# Generated from blog old_slugs. Do not edit by hand.';
let existing = '';
if (await exists(publicFile)) {
  existing = (await readFile(publicFile, 'utf8')).trimEnd();
}

const parts = [];
if (existing) parts.push(existing);
parts.push(header);
if (generated.length) parts.push(generated.join('\n'));
else parts.push('# (none)');

await writeFile(distFile, `${parts.join('\n')}\n`, 'utf8');
