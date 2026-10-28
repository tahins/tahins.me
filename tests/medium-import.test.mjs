import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {
  htmlToMarkdown,
  importFromExportZip,
  isMediumResponse,
  mediumImageKey,
  mediumStoryId,
  mergePosts,
  parseExportHtml,
  parseRssXml,
  rewriteImages,
  slugFromMediumUrl,
  storyPermalink,
  toMarkdownFile,
} from '../scripts/lib/medium-import.mjs';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

async function load(name) {
  return readFile(path.join(fixtures, name), 'utf8');
}

test('parses official Medium export HTML: title, dates, tags, canonical URL', async () => {
  const html = await load('medium-export-sample.html');
  const post = parseExportHtml(html, '2018-04-25_Sample-ccf34a785233.html');
  assert.equal(post.title, 'Sample Medium export post');
  assert.equal(post.originalUrl, 'https://tahins.medium.com/ccf34a785233');
  assert.equal(post.draft, false);
  assert.equal(post.pubDate.toISOString(), '2018-04-25T16:21:43.123Z');
  assert.equal(post.updatedDate.toISOString(), '2018-04-26T15:50:14.644Z');
  assert.deepEqual(post.tags, ['tdd', 'programming']);
  assert.match(post.html, /FibonacciSpec/);
});

test('keeps code blocks, quotes, headings, and converts embeds to links', async () => {
  const html = await load('medium-export-sample.html');
  const post = parseExportHtml(html);
  const file = toMarkdownFile(post);
  assert.match(file.markdown, /```[\s\S]*getNthFibonacci\(1\)[\s\S]*```/);
  assert.match(file.markdown, /> It is a “break first, build later” approach/);
  assert.match(file.markdown, /### A heading/);
  assert.match(file.markdown, /Watch on YouTube/);
  assert.match(file.markdown, /gist\.github\.com\/tahins\/abc123/);
  assert.match(file.markdown, /pubDate: 2018-04-25T16:21:43.123Z/);
  assert.match(file.markdown, /draft: false/);
  assert.match(file.markdown, /originalUrl: https:\/\/tahins\.medium\.com\/ccf34a785233/);
});

test('Unsplash images stay remote and keep photographer credit', async () => {
  const html = await load('medium-export-sample.html');
  const rewritten = rewriteImages(parseExportHtml(html).html, { slug: 'sample' });
  const unsplash = rewritten.images.find((img) => img.kind === 'unsplash');
  assert.ok(unsplash);
  assert.match(unsplash.rewrittenUrl, /images\.unsplash\.com/);
  assert.equal(unsplash.localized, false);
  assert.equal(unsplash.credit.photographer, 'Robert Collins');
  assert.equal(unsplash.credit.photographerUrl, 'https://unsplash.com/@robbie36');
  assert.match(rewritten.html, /Photo by/);
  assert.match(rewritten.html, /Unsplash/);
  const file = toMarkdownFile(parseExportHtml(html));
  assert.match(file.markdown, /<img src="https:\/\/images\.unsplash\.com\/photo-1502086223501-7ea6ecd79368/);
  assert.doesNotMatch(file.markdown, /!\[.*\]\(https:\/\/images\.unsplash\.com/);
});

test('Medium CDN screenshots are rewritten to local asset paths', async () => {
  const html = await load('medium-export-sample.html');
  const rewritten = rewriteImages(parseExportHtml(html).html, { slug: 'sample-medium-export-post' });
  const localized = rewritten.images.filter((img) => img.kind === 'medium');
  assert.equal(localized.length, 1);
  assert.equal(
    localized[0].rewrittenUrl,
    '../../assets/blog/sample-medium-export-post/image-1.png',
  );
  assert.match(localized[0].originalUrl, /miro\.medium\.com/);
});

test('importFromExportZip reads posts/*.html inside a zip', async () => {
  const html = await load('medium-export-sample.html');
  const zip = new JSZip();
  zip.file('profile/profile.html', '<html></html>');
  zip.file('posts/2018-04-25_Sample-ccf34a785233.html', html);
  const { written, report } = await importFromExportZip(await zip.generateAsync({ type: 'nodebuffer' }), {
    download: false,
  });
  assert.equal(report.found, 1);
  assert.equal(report.imported, 1);
  assert.equal(written[0].slug, 'sample-medium-export-post');
  assert.equal(report.localizedImages.length, 1);
  assert.equal(report.unsplashImages.length, 1);
});

test('RSS parser reads real Medium feed items including Bangla titles and tags', async () => {
  const xml = await load('medium-rss.xml');
  const items = parseRssXml(xml);
  assert.equal(items.length, 10);
  assert.equal(items[0].title, 'ন্যায় ও ইহসান');
  assert.ok(items[0].pubDate);
  assert.ok(items[0].html.includes('ইহসান'));
  const tdd = items.find((item) => item.title.includes('by example'));
  assert.ok(tdd);
  assert.ok(tdd.tags.includes('tdd'));
  assert.match(tdd.html, /<pre>/);
});

test('real RSS Unsplash figure is rewritten to images.unsplash.com', async () => {
  const html = await load('rss-tin-ti-jama.html');
  const converted = htmlToMarkdown(html, { slug: 'tin-ti-jama' });
  const unsplash = converted.images.find((img) => img.kind === 'unsplash');
  assert.ok(unsplash);
  assert.equal(unsplash.credit.photographer, 'Mnz');
  assert.match(unsplash.rewrittenUrl, /images\.unsplash\.com\/photo-1542219550-2da790bf52e9/);
  assert.equal(converted.images.filter((img) => img.kind === 'medium').length, 0);
});

test('real RSS TDD example keeps fenced code and maps Unsplash football photo', async () => {
  const html = await load('rss-tdd-by-example.html');
  const converted = htmlToMarkdown(html, { slug: 'test-driven-development-tdd-by-example' });
  assert.match(converted.markdown, /```[\s\S]*getNthFibonacci/);
  const unsplash = converted.images.find((img) => img.kind === 'unsplash');
  assert.match(unsplash.rewrittenUrl, /photo-1502086223501-7ea6ecd79368/);
});

test('TDD mindset diagrams (no Unsplash credit) are marked for localization', async () => {
  const html = await load('rss-tdd-mindset.html');
  const converted = htmlToMarkdown(html, { slug: 'the-mindset-behind-test-driven-development-tdd' });
  const localized = converted.images.filter((img) => img.kind === 'medium');
  assert.ok(localized.length >= 3);
  assert.ok(localized.every((img) => img.rewrittenUrl.startsWith('../../assets/blog/')));
});

test('slugFromMediumUrl strips the Medium post id', () => {
  assert.equal(
    slugFromMediumUrl(
      'https://tahins.medium.com/test-driven-development-tdd-by-example-ccf34a785233',
      'unused',
    ),
    'test-driven-development-tdd-by-example',
  );
  assert.equal(mediumImageKey('https://cdn-images-1.medium.com/max/1024/0*HIy3JgWyB0Fl39sn.'), '0*hiy3jgwyb0fl39sn');
});

test('originalUrl keeps only the Medium story id on tahins.medium.com', () => {
  assert.equal(mediumStoryId('https://medium.com/green-and-red/go-mobile-with-g-r-937707e66678'), '937707e66678');
  assert.equal(
    storyPermalink('https://tahins.medium.com/test-driven-development-tdd-by-example-ccf34a785233'),
    'https://tahins.medium.com/ccf34a785233',
  );
  assert.equal(
    mediumStoryId(
      'https://tahins.medium.com/%E0%A6%A8%E0%A7%8D%E0%A6%AF%E0%A6%BE%E0%A6%AF%E0%A6%BC-%E0%A6%93-%E0%A6%87%E0%A6%B9%E0%A6%B8%E0%A6%BE%E0%A6%A8-df686b6e20f5?source=rss-dfef12df0c92------2',
    ),
    'df686b6e20f5',
  );
  assert.equal(
    storyPermalink(
      'https://tahins.medium.com/test-driven-development-tdd-by-example-ccf34a785233?source=rss-dfef12df0c92------2',
    ),
    'https://tahins.medium.com/ccf34a785233',
  );
});

test('Bangla posts get readable transliterated slugs instead of dash soup', () => {
  assert.equal(
    slugFromMediumUrl(
      'https://tahins.medium.com/%E0%A6%A8%E0%A7%8D%E0%A6%AF%E0%A6%BE%E0%A6%AF%E0%A6%BC-%E0%A6%93-%E0%A6%87%E0%A6%B9%E0%A6%B8%E0%A6%BE%E0%A6%A8-df686b6e20f5',
      'ন্যায় ও ইহসান',
    ),
    'nyay-o-ihsan',
  );
  assert.equal(
    slugFromMediumUrl('', 'ন্যায় ও ইহসান', '2026-10-27_--------df686b6e20f5.html'),
    'nyay-o-ihsan',
  );
});

test('Medium responses (comments) import as draft', async () => {
  const html = await load('medium-response-sample.html');
  assert.equal(isMediumResponse(html, '2015-12-14_Your-dramatic-intro….html'), true);
  const post = parseExportHtml(html, '2015-12-14_Your-dramatic-intro….html');
  assert.equal(post.draft, true);
  const file = toMarkdownFile(post);
  assert.match(file.markdown, /draft: true/);
  assert.match(file.markdown, /originalUrl: https:\/\/tahins\.medium\.com\/aaaaaaaaaaaa/);
});

test('named response filenames are drafts even without p-in-reply-to', () => {
  const html = `<article><h1 class="p-name">Your dramatic intro…</h1>
    <a class="p-canonical" href="https://tahins.medium.com/bbbbbbbbbbbb"></a>
    <section class="e-content"><p>Short reply.</p></section></article>`;
  assert.equal(isMediumResponse(html, '2015-12-14_Your-dramatic-intro--.html'), true);
  assert.equal(
    isMediumResponse(html, '2016-10-03_One-might-never-figure-it-out--.html'),
    true,
  );
  assert.equal(parseExportHtml(html, '2016-10-03_One-might-never-figure-it-out--.html').draft, true);
  assert.equal(isMediumResponse(html, '2018-04-25_Sample-ccf34a785233.html'), false);
});

test('export zip ignores everything except posts/*.html', async () => {
  const story = await load('medium-export-sample.html');
  const response = await load('medium-response-sample.html');
  const zip = new JSZip();
  zip.file('profile/profile.html', '<html><body>private</body></html>');
  zip.file('claps/claps.csv', 'private');
  zip.file('drafts/secret.html', '<article><h1>Draft</h1><section class="e-content"><p>no</p></section></article>');
  zip.file('posts/2018-04-25_Sample-ccf34a785233.html', story);
  zip.file('posts/2015-12-14_Your-dramatic-intro--.html', response);
  const { written, report } = await importFromExportZip(await zip.generateAsync({ type: 'nodebuffer' }), {
    download: false,
  });
  assert.equal(report.found, 2);
  assert.equal(written.length, 2);
  const drafts = written.filter((post) => post.draft);
  assert.equal(drafts.length, 1);
  assert.match(drafts[0].filename, /your-dramatic-intro/);
  assert.ok(!written.some((post) => /secret|private|Draft/.test(post.title)));
});

test('mergePosts de-dupes RSS and export by story id', () => {
  const merged = mergePosts([
    [{ title: 'From zip', originalUrl: 'https://tahins.medium.com/ccf34a785233', html: '<p>zip</p>' }],
    [{
      title: 'From RSS',
      originalUrl: 'https://tahins.medium.com/test-driven-development-tdd-by-example-ccf34a785233',
      html: '<p>rss</p>',
    }],
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].title, 'From zip');
});
