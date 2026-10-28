#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBlogFrontmatter } from './lib/blog-frontmatter.mjs';
import { assertSlugs } from '../src/lib/slugs.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const posts = await loadBlogFrontmatter(path.join(root, 'src/content/blog'));
assertSlugs(posts);
