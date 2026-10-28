import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function mime(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css';
  if (file.endsWith('.js')) return 'text/javascript';
  if (file.endsWith('.woff2')) return 'font/woff2';
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.webp')) return 'image/webp';
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

test('header computed styles match on / and an article in light and dark', async (t) => {
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
  try {
    const keys = [
      'backgroundColor',
      'color',
      'fontFamily',
      'fontSize',
      'letterSpacing',
      'padding',
      'textTransform',
      'height',
    ];
    for (const width of [390, 1440]) {
      for (const colorScheme of ['light', 'dark']) {
        const readings = [];
        for (const pathname of ['/', '/blog/tin-ti-jama-surah-yusuf/']) {
          const page = await browser.newPage({
            viewport: { width, height: 900 },
            colorScheme,
          });
          await page.goto(`${origin}${pathname}`, { waitUntil: 'domcontentloaded' });
          const styles = await page.evaluate(() => {
            const header = document.querySelector('.site-header');
            const brand = document.querySelector('.navbar .brand');
            const link = document.querySelector('.navbar .nav-links a');
            const nav = document.querySelector('.navbar');
            const cs = (el) => getComputedStyle(el);
            return {
              backgroundColor: cs(header).backgroundColor,
              color: cs(link).color,
              brandColor: cs(brand).color,
              fontFamily: cs(header).fontFamily,
              fontSize: cs(header).fontSize,
              letterSpacing: cs(header).letterSpacing,
              padding: cs(header).padding,
              textTransform: cs(link).textTransform,
              height: Math.round(nav.getBoundingClientRect().height),
            };
          });
          readings.push(styles);
          await page.close();
        }
        const [home, article] = readings;
        for (const key of keys) {
          assert.equal(home[key], article[key], `${width}px ${colorScheme} ${key}`);
        }
        assert.equal(home.backgroundColor, 'rgb(0, 0, 0)');
        assert.equal(home.color, 'rgb(255, 255, 255)');
        assert.match(home.fontFamily, /Consolas/i);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
});
