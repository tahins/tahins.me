import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { parse as parseYaml } from 'yaml';
import { loadBlogFrontmatter } from '../scripts/lib/blog-frontmatter.mjs';
import {
  SLUG_RE,
  assertSlugs,
  collectSlugErrors,
  isValidSlug,
  netlifyRedirectLines,
  postSlug,
} from '../src/lib/slugs.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const blogDir = path.join(root, 'src/content/blog');

const EXPECTED_POST_PATHS = [
  '/blog/3-dress-surah-yusuf/',
  '/blog/ad-creator-tool/',
  '/blog/becoming-a-product-manager-part-1/',
  '/blog/enable-google-now/',
  '/blog/g-r-html5-clicktag-tutorial/',
  '/blog/go-mobile-with-g-r/',
  '/blog/justice-and-ihsan/',
  '/blog/less-time-managing-ads/',
  '/blog/lg-scratch-card/',
  '/blog/muslim-entrepreneur-part-1/',
  '/blog/stay-mobile-with-g-r/',
  '/blog/tdd-by-example/',
  '/blog/tdd-mindset/',
  '/blog/two-questions-before-work/',
  '/blog/weak-seeker/',
  '/blog/what-is-truth/',
];

const PREVIOUSLY_LIVE_SLUGS = [
  'becoming-a-product-manager-part-1',
  'durbol-sei-onneshonkari',
  'enable-google-now-in-non-supported-countries',
  'g-r-html5-clicktag-tutorial',
  'go-mobile-with-g-r',
  'introducing-ad-creator-tool-by-g-r',
  'lgs-innovative-digital-scratch-card-campaign-to-draw-a-positive-attention',
  'mobile-e-thakun-gr-er-sathe',
  'nyay-o-ihsan',
  'protita-kajer-samne-duto-proshno',
  'shotto-ki-ar-mithya-ki',
  'spend-less-time-managing-ads-and-more-time-enjoying-life',
  'test-driven-development-tdd-by-example',
  'the-mindset-behind-test-driven-development-tdd',
  'tin-ti-jama-surah-yusuf',
];

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

const schema = await readFile(path.join(root, 'src/content.config.ts'), 'utf8');
const blogLib = await readFile(path.join(root, 'src/lib/blog.js'), 'utf8');
const slugPage = await readFile(path.join(root, 'src/pages/blog/[...slug].astro'), 'utf8');
const astroConfig = await readFile(path.join(root, 'astro.config.mjs'), 'utf8');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const posts = await loadBlogFrontmatter(blogDir);

test('schema requires slug and optional old_slugs with the same pattern', () => {
  assert.match(schema, /slug:\s*slugField/);
  assert.match(schema, /old_slugs:\s*z\.array\(slugField\)\.default\(\[\]\)/);
  assert.match(schema, /SLUG_RE/);
  assert.equal(SLUG_RE.test('nyay-o-ihsan'), true);
  assert.equal(SLUG_RE.test('g-r-html5-clicktag-tutorial'), true);
  assert.equal(isValidSlug('-leading'), false);
  assert.equal(isValidSlug('trailing-'), false);
  assert.equal(isValidSlug('double--hyphen'), false);
  assert.equal(isValidSlug('TitleCase'), false);
  assert.equal(isValidSlug('under_score'), false);
  assert.equal(isValidSlug(''), false);
});

test('fails on a missing slug, invalid format, or duplicate slug', () => {
  assert.match(collectSlugErrors([{ file: 'a.md' }]).join('\n'), /missing slug/);
  assert.match(
    collectSlugErrors([{ slug: 'Bad_Slug', file: 'a.md' }]).join('\n'),
    /invalid slug/,
  );
  assert.match(
    collectSlugErrors([
      { slug: 'same-post', file: 'a.md' },
      { slug: 'same-post', file: 'b.md' },
    ]).join('\n'),
    /duplicate slug/,
  );
  assert.doesNotThrow(() =>
    assertSlugs([
      { slug: 'one', file: 'a.md' },
      { slug: 'two', file: 'b.md', old_slugs: ['old-two'] },
    ]),
  );
  assert.throws(
    () => assertSlugs([{ slug: 'same', file: 'a.md' }, { slug: 'same', file: 'b.md' }]),
    /duplicate slug/,
  );
});

test('every post has a unique valid slug equal to its current URL', () => {
  assertSlugs(posts);
  assert.equal(posts.length, 16);
  const paths = posts.map((post) => `/blog/${post.slug}/`).sort();
  assert.deepEqual(paths, [...EXPECTED_POST_PATHS].sort());
  for (const post of posts) {
    const stem = post.file.replace(/\.mdx?$/, '');
    assert.equal(post.slug, stem, `${post.file} slug should match the filename`);
  }
  for (const old of PREVIOUSLY_LIVE_SLUGS) {
    const post = posts.find((p) => p.slug === old || p.old_slugs.includes(old));
    assert.ok(post, `previously live slug ${old} must still resolve via slug or old_slugs`);
  }
});

test('every post has a short excerpt without long dashes', async () => {
  for (const post of posts) {
    const raw = await readFile(path.join(blogDir, post.file), 'utf8');
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const data = parseYaml(match[1]) ?? {};
    assert.equal(typeof data.excerpt, 'string', `${post.file} needs excerpt`);
    assert.ok(data.excerpt.trim().length > 0, `${post.file} excerpt is empty`);
    assert.ok(data.excerpt.length <= 160, `${post.file} excerpt is ${data.excerpt.length} chars`);
    assert.equal(
      /[—–\u2013\u2014]/.test(data.excerpt),
      false,
      `${post.file} excerpt has a long dash`,
    );
  }
});

test('routes, RSS, and paths use frontmatter slug, not the filename or title', () => {
  assert.match(blogLib, /postSlug\(post\)/);
  assert.doesNotMatch(blogLib, /post\.id\.replace/);
  assert.match(slugPage, /params: \{ slug: post\.data\.slug \}/);
  assert.match(slugPage, /postPath\(post\)/);
  assert.doesNotMatch(slugPage, /post\.id\.replace/);
  assert.equal(postSlug({ data: { slug: 'nyay-o-ihsan' } }), 'nyay-o-ihsan');
  assert.throws(() => postSlug({ data: {} }), /missing a valid slug/);
  assert.throws(() => postSlug({ id: 'from-filename' }), /missing a valid slug/);
});

test('old_slugs become Netlify 301 lines, not Astro redirects', () => {
  const lines = netlifyRedirectLines([
    { slug: 'new-name', old_slugs: ['old-name', 'even-older'] },
  ]);
  assert.deepEqual(lines, [
    '/blog/old-name/ /blog/new-name/ 301',
    '/blog/even-older/ /blog/new-name/ 301',
  ]);
  assert.match(pkg.scripts.build, /write-blog-redirects/);
  assert.match(pkg.scripts.build, /check-slugs/);
  assert.doesNotMatch(astroConfig, /redirects\s*:/);
});

test('built pages, RSS, and sitemap keep the same URL list; old_slugs are 301s', async (t) => {
  const dist = path.join(root, 'dist');
  if (!(await exists(dist))) {
    t.skip('dist/ not built yet');
    return;
  }

  const htmlPages = (await walk(dist))
    .filter((file) => file.endsWith('index.html'))
    .map((file) =>
      `/${path.relative(dist, file).replace(/index\.html$/, '')}`.replace(/\\/g, '/'),
    )
    .sort();
  const postPages = htmlPages.filter(
    (url) => url.startsWith('/blog/') && !url.startsWith('/blog/tags/') && url !== '/blog/',
  );
  assert.deepEqual(postPages, [...EXPECTED_POST_PATHS].sort());

  const rss = await readFile(path.join(dist, 'blog/rss.xml'), 'utf8');
  const rssLinks = [...rss.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)]
    .map((match) => {
      const href = match[1];
      const at = href.indexOf('/blog/');
      return at === -1 ? null : href.slice(at);
    })
    .filter(Boolean)
    .sort();
  assert.deepEqual(rssLinks, [...EXPECTED_POST_PATHS].sort());

  const sitemap = await readFile(path.join(dist, 'sitemap-0.xml'), 'utf8');
  for (const url of EXPECTED_POST_PATHS) {
    assert.match(sitemap, new RegExp(`https://tahins\\.me${url.replaceAll('/', '\\/')}`));
  }

  const redirectsPath = path.join(dist, '_redirects');
  assert.equal(await exists(redirectsPath), true, 'dist/_redirects should exist');
  const redirects = await readFile(redirectsPath, 'utf8');
  for (const post of posts) {
    for (const old of post.old_slugs) {
      assert.match(
        redirects,
        new RegExp(`^/blog/${old}/ /blog/${post.slug}/ 301$`, 'm'),
        `${old} -> ${post.slug}`,
      );
    }
  }

  const htmlFiles = (await walk(dist)).filter((file) => file.endsWith('.html'));
  const refreshPages = [];
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    if (/http-equiv=["']refresh["']/i.test(html) || /http-equiv=refresh/i.test(html)) {
      refreshPages.push(path.relative(dist, file));
    }
  }
  assert.deepEqual(refreshPages, [], 'no meta-refresh redirect pages in dist');
});
