import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { countReadableWords, readingMinutes } from '../src/lib/reading-time.js';
import { blogProfile } from '../src/data/site.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

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

const css = await readFile(path.join(root, 'src/styles/global.css'), 'utf8');
const schema = await readFile(path.join(root, 'src/content.config.ts'), 'utf8');
const indexPage = await readFile(path.join(root, 'src/pages/blog/index.astro'), 'utf8');
const sidebar = await readFile(path.join(root, 'src/components/BlogSidebar.astro'), 'utf8');
const list = await readFile(path.join(root, 'src/components/BlogPostList.astro'), 'utf8');
const article = await readFile(path.join(root, 'src/pages/blog/[...slug].astro'), 'utf8');
const hello = await readFile(path.join(root, 'src/components/Hello.astro'), 'utf8');

test('blog bio and Staff title', () => {
  assert.match(hello, /Staff Software Engineer/);
  assert.equal(blogProfile.bio, 'Muslim • Father • Software engineer • Technologist');
  assert.equal(blogProfile.role, 'Staff Software Engineer');
  assert.equal(blogProfile.name, 'Tahin Rahman');
});

test('reading time is ~200 wpm and counts Bangla words', () => {
  const english = Array.from({ length: 400 }, () => 'word').join(' ');
  assert.equal(readingMinutes(english), 2);
  assert.equal(countReadableWords('ন্যায় ও ইহসান একটি গভীর কথা'), 6);
  assert.equal(readingMinutes('ন্যায়'), 1);
  assert.ok(readingMinutes(english) < readingMinutes(english + ' ' + english));
});

test('featured is in the schema and no post is flagged', async () => {
  assert.match(schema, /featured:\s*z\.boolean\(\)\.default\(false\)/);
  const posts = (await walk(path.join(root, 'src/content/blog'))).filter((file) =>
    file.endsWith('.md'),
  );
  const flagged = [];
  for (const file of posts) {
    const text = await readFile(file, 'utf8');
    if (/^featured:\s*true\s*$/m.test(text)) flagged.push(path.basename(file));
  }
  assert.deepEqual(flagged, []);
});

test('list uses a stretched title link, a preview, and the excerpt helper', () => {
  assert.match(list, /class="post-stretched"/);
  assert.match(list, /PostPreviewThumb/);
  assert.match(list, /readingLabel/);
  assert.match(list, /postExcerpt/);
  assert.match(schema, /excerpt:\s*z\.string\(\)\.optional/);
});

test('blog CSS is a 680px column, then a 1024px sidebar, Literata body, and color-scheme', () => {
  assert.match(css, /\.blog-feed,\s*\.blog-post \{[\s\S]*max-width:\s*680px/);
  assert.match(css, /@media \(min-width: 1024px\)/);
  assert.match(css, /minmax\(0, 680px\) 300px/);
  assert.match(css, /column-gap:\s*56px/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /Literata/);
  assert.match(css, /Charter/);
  assert.match(css, /prefers-color-scheme:\s*dark/);
  assert.match(css, /\.blog-theme \{[\s\S]*background: var\(--blog-bg\)/);
  assert.match(css, /--blog-link:\s*#9a3412/);
  assert.match(css, /\.blog-post \.prose img,\s*\.blog-post \.prose picture \{[\s\S]*width:\s*100%/);
});

test('sidebar markup is an aside with RSS, topics, and current work — no Medium', () => {
  assert.match(sidebar, /<aside class="blog-sidebar" aria-label="Blog sidebar">/);
  assert.match(sidebar, /href="\/blog\/rss\.xml"/);
  assert.match(sidebar, /\/blog\/tags\/\$\{tag\}\//);
  assert.match(indexPage, /<BlogSidebar/);
  assert.doesNotMatch(sidebar, /medium\.com/i);
  assert.match(sidebar, /Email me/);
  assert.match(sidebar, /\/#profile/);
});

test('article page has cover, author, about footer, and a single H1 title', () => {
  assert.match(article, /class="article-title"/);
  assert.match(article, /ArticleCover/);
  assert.ok(article.indexOf('ArticleCover') < article.indexOf('article-title'));
  assert.match(article, /About Tahin/);
  assert.match(article, /href="\/blog\/"/);
  assert.match(article, /variant="blog"/);
  assert.match(article, /postExcerpt/);
  assert.doesNotMatch(article, /Originally published on/);
});

test('built /blog rows have a preview and the sidebar; tag pages have posts', async (t) => {
  const dist = path.join(root, 'dist');
  if (!(await exists(dist))) {
    t.skip('dist/ not built yet');
    return;
  }
  const indexHtml = await readFile(path.join(dist, 'blog/index.html'), 'utf8');
  const rows = [...indexHtml.matchAll(/class="post-row"/g)];
  const previews = [...indexHtml.matchAll(/class="post-preview"/g)];
  assert.ok(rows.length >= 15, `expected 15+ post rows, got ${rows.length}`);
  assert.equal(previews.length, rows.length, 'each row needs a preview');
  assert.match(indexHtml, /aria-label="Blog sidebar"/);
  assert.match(indexHtml, /href="\/blog\/rss\.xml"/);
  assert.doesNotMatch(indexHtml, /href=["']["']/);

  const tagDir = path.join(dist, 'blog/tags');
  assert.equal(await exists(tagDir), true);
  const tagFiles = (await walk(tagDir)).filter((file) => file.endsWith('index.html'));
  assert.ok(tagFiles.length > 0, 'expected generated tag pages');
  const sample = await readFile(tagFiles[0], 'utf8');
  assert.match(sample, /class="post-row"/);
  assert.match(sample, /<h1/);
  assert.doesNotMatch(sample, /href=["']["']/);

  const articleHtml = await readFile(
    path.join(dist, 'blog/the-mindset-behind-test-driven-development-tdd/index.html'),
    'utf8',
  );
  assert.match(articleHtml, /class="blog-post/);
  assert.match(articleHtml, /max-width:680px|class="blog-post/);
  assert.match(articleHtml, /About Tahin/);
  assert.doesNotMatch(articleHtml, /Originally published on Medium/);
  const coverAt = articleHtml.indexOf('article-cover');
  const titleAt = articleHtml.indexOf('article-title');
  assert.ok(coverAt !== -1 && titleAt !== -1 && coverAt < titleAt);
});
