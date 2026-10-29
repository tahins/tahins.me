import { createServer } from 'node:http';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const SHOTS = ['todox', 'getbriefly', 'hajjmate', 'quran-map', 'alaap', 'dua-deck', 'gdvs'];
const SHOT_ALTS = {
  Todox: 'Todox home page with the headline The Command Center For Your Life',
  getbriefly: 'getbriefly home page with the headline News, simplified',
  HajjMate: 'HajjMate home page with the headline Never miss a step on your sacred journey',
  'Quran Map': 'Quran Map surah list in Bangla, with the Mushaf and memorization modes',
  'Dua Deck': 'Dua Deck showing a swipeable dua card in Arabic',
  'Alaap SMS': 'Alaap SMS home page with the headline Your OTPs stay loud. Your promos go quiet',
  'Guided Verses':
    'Guided Verses on phone, tablet, desktop, and laptop showing a verse with English and Bangla translations',
};

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

function mime(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css';
  if (file.endsWith('.js')) return 'text/javascript';
  if (file.endsWith('.woff2')) return 'font/woff2';
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.webp')) return 'image/webp';
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg';
  if (file.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

async function serveDist() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    let filePath = path.join(dist, decodeURIComponent(url.pathname));
    try {
      const info = await stat(filePath);
      if (info.isDirectory()) filePath = path.join(filePath, 'index.html');
    } catch {
      filePath = path.join(dist, '404.html');
    }
    try {
      const body = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': mime(filePath) });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('missing');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

test('source PNGs live in src/assets/projects and not public/', async () => {
  for (const name of SHOTS) {
    assert.equal(await exists(path.join(root, 'src/assets/projects', `${name}.png`)), true);
    assert.equal(await exists(path.join(root, 'public', `${name}.png`)), false);
    assert.equal(await exists(path.join(root, 'public/img', `${name}.png`)), false);
  }
});

test('dist has no raw project-shot PNG files', async (t) => {
  if (!(await exists(dist))) {
    t.skip('dist/ not built yet');
    return;
  }
  const files = await walk(dist);
  const banned = files.filter((file) => {
    const base = path.basename(file).toLowerCase();
    return SHOTS.some((name) => base.includes(name) && base.endsWith('.png'));
  });
  assert.deepEqual(banned, []);
  const html = await readFile(path.join(dist, 'index.html'), 'utf8');
  for (const name of SHOTS) {
    assert.doesNotMatch(html, new RegExp(`${name}[^"'\\s]*\\.png`, 'i'));
    assert.match(html, new RegExp(`${name}[^"'\\s]*\\.webp`, 'i'));
  }
});

test('home page current-work cards are Todox, Alaap SMS, getbriefly, HajjMate, Quran Map, Dua Deck, Guided Verses', async (t) => {
  if (!(await exists(dist))) {
    t.skip('dist/ not built yet');
    return;
  }
  const html = await readFile(path.join(dist, 'index.html'), 'utf8');
  const list = html.match(/<ul class="current-projects">[\s\S]*?<\/ul>/);
  assert.ok(list, 'missing current-projects list');
  assert.deepEqual(
    [...list[0].matchAll(/<h3 class="project-title">[\s\S]*?<\/h3>/g)].map((match) =>
      match[0].replace(/<[^>]+>/g, '').trim(),
    ),
    [
      'Todox',
      'Alaap SMS',
      'getbriefly',
      'HajjMate',
      'Quran Map',
      'Dua Deck',
      'Guided Verses',
    ],
  );
});

test('every current-project card renders a site-shot img with alt and a fixed thumb ratio', async (t) => {
  if (!(await exists(dist))) {
    t.skip('dist/ not built yet');
    return;
  }
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    t.skip('playwright is not installed');
    return;
  }

  const { server, origin } = await serveDist();
  const browser = await chromium.launch({
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  async function thumbBoxes(page) {
    return page.evaluate(() =>
      [...document.querySelectorAll('.current-project')].map((card) => {
        const box = card.querySelector('.project-thumb');
        const r = box.getBoundingClientRect();
        const title = card.querySelector('.project-title')?.textContent.trim();
        return {
          title,
          width: r.width,
          height: r.height,
          ratio: r.height ? r.width / r.height : 0,
          hasImg: Boolean(box.querySelector('img')),
          hasPlaceholder: Boolean(box.querySelector('.project-placeholder')),
          alt: box.querySelector('img')?.getAttribute('alt') || '',
          imgWidth: box.querySelector('img')?.getAttribute('width') || '',
          imgHeight: box.querySelector('img')?.getAttribute('height') || '',
        };
      }),
    );
  }

  try {
    for (const [width, expectedRatio] of [
      [390, 1],
      [1440, 16 / 10],
    ]) {
      const page = await browser.newPage({
        viewport: { width, height: 1600 },
        colorScheme: 'dark',
      });
      await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('#projects').scrollIntoViewIfNeeded();
      const before = await thumbBoxes(page);
      await page.evaluate(() =>
        Promise.all(
          [...document.images].map((img) =>
            img.complete
              ? null
              : new Promise((resolve) => {
                  img.addEventListener('load', resolve, { once: true });
                  img.addEventListener('error', resolve, { once: true });
                }),
          ),
        ),
      );
      await page.waitForTimeout(200);
      const after = await thumbBoxes(page);

      const byTitle = Object.fromEntries(after.map((row) => [row.title, row]));
      for (const [title, alt] of Object.entries(SHOT_ALTS)) {
        assert.equal(byTitle[title]?.hasImg, true, `${title} missing img`);
        assert.equal(byTitle[title]?.hasPlaceholder, false, `${title} still a placeholder`);
        assert.equal(byTitle[title]?.alt, alt);
        assert.equal(byTitle[title]?.imgWidth, '800');
        assert.equal(byTitle[title]?.imgHeight, '500');
      }
      assert.equal(after.length, Object.keys(SHOT_ALTS).length);
      assert.deepEqual(after.map((row) => row.title), [
        'Todox',
        'Alaap SMS',
        'getbriefly',
        'HajjMate',
        'Quran Map',
        'Dua Deck',
        'Guided Verses',
      ]);

      for (const [phase, rows] of [
        ['before', before],
        ['after', after],
      ]) {
        for (const row of rows) {
          assert.ok(
            Math.abs(row.ratio - expectedRatio) < 0.05,
            `${width}px ${phase} ${row.title} ratio ${row.ratio} != ${expectedRatio} (${row.width}x${row.height})`,
          );
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
});
