#!/usr/bin/env node
/**
 * Import Medium posts into src/content/blog.
 *
 * Usage:
 *   node scripts/import-medium.mjs
 *   node scripts/import-medium.mjs --zip ~/Downloads/medium-export.zip
 *   node scripts/import-medium.mjs --rss https://medium.com/feed/@tahins
 *   node scripts/import-medium.mjs --html-dir scripts/data/public-posts
 *   node scripts/import-medium.mjs --no-download
 *
 * Official Medium data export: Settings → Download your information.
 * The zip contains posts/*.html — pass that zip with --zip.
 *
 * Medium RSS only carries recent posts (typically 10). Older public posts
 * can be added via --html-dir or a later export zip.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_RSS_URL,
  fetchText,
  mergePosts,
  parseExportHtml,
  parseExportZip,
  parseRssXml,
  readHtmlDir,
  writePosts,
} from './lib/medium-import.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

function argValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function main() {
  const zipPath = argValue('--zip');
  const rssUrl = hasFlag('--rss') ? argValue('--rss') || DEFAULT_RSS_URL : DEFAULT_RSS_URL;
  const htmlDir = argValue('--html-dir') || path.join(here, 'data/public-posts');
  const outDir = argValue('--out') || path.join(root, 'src/content/blog');
  const assetsDir = argValue('--assets') || path.join(root, 'src/assets/blog');
  const download = !hasFlag('--no-download');
  const skipRss = hasFlag('--no-rss');

  const groups = [];
  const sources = [];

  if (zipPath) {
    const buf = await readFile(zipPath);
    const zipPosts = await parseExportZip(buf);
    groups.push(zipPosts);
    sources.push(`zip ${zipPath} (${zipPosts.length})`);
    console.log(`zip ${zipPath}: ${zipPosts.length} posts/*.html`);
  }

  if (!skipRss) {
    const xml = await fetchText(rssUrl);
    groups.push(parseRssXml(xml));
    sources.push(`rss ${groups.at(-1).length}`);
    console.log(`RSS ${rssUrl}: ${groups.at(-1).length} items (feed is recent-only)`);
  }

  try {
    const files = await readHtmlDir(htmlDir);
    if (files.length) {
      groups.push(files.map(({ filename, html }) => parseExportHtml(html, filename)));
      sources.push(`html-dir ${files.length}`);
      console.log(`HTML dir ${htmlDir}: ${files.length} files`);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const posts = mergePosts(groups);
  const { written, report } = await writePosts(posts, {
    outDir,
    assetsDir,
    download,
    replaceExisting: true,
  });
  printReport({ source: sources.join(' + ') || 'nothing', report, written });
  await writeReport(root, report, written);
}

function printReport({ source, report, written }) {
  console.log(`\nImported from ${source}`);
  console.log(`Found: ${report.found}`);
  console.log(`Imported: ${report.imported}`);
  if (report.skipped.length) {
    console.log('Skipped:', report.skipped);
  }
  console.log('\nLocalized Medium-hosted images:');
  for (const img of report.localizedImages) {
    console.log(`  - ${img.slug}: ${img.originalUrl} -> ${img.localPath}`);
  }
  console.log('\nUnsplash hotlinks:');
  for (const img of report.unsplashImages) {
    console.log(`  - ${img.slug}: ${img.photographer} — ${img.unsplashUrl}`);
  }
  if (report.remainingMediumCdn.length) {
    console.log('\nStill pointing at Medium CDN (needs a later decision):');
    for (const img of report.remainingMediumCdn) {
      console.log(`  - ${img.slug}: ${img.url}`);
    }
  }
  console.log('\nPosts:');
  for (const post of written) {
    const draft = post.draft ? ' [draft]' : '';
    console.log(`  - ${post.slug}${draft} (${post.originalUrl})`);
  }
}

async function writeReport(rootDir, report, written) {
  const payload = {
    generatedAt: new Date().toISOString(),
    note: 'Medium RSS only carries recent posts. Re-run with --zip when Tahin provides the official export.',
    found: report.found,
    imported: report.imported,
    posts: written.map((post) => ({
      slug: post.slug,
      title: post.title,
      originalUrl: post.originalUrl,
      draft: Boolean(post.draft),
    })),
    localizedImages: report.localizedImages,
    unsplashImages: report.unsplashImages,
    remainingMediumCdn: report.remainingMediumCdn,
    skipped: report.skipped,
  };
  await writeFile(
    path.join(rootDir, 'scripts/data/last-import-report.json'),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
