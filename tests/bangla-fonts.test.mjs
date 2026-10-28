import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ARTICLE = '/blog/justice-and-ihsan/';
const NOTO_400 = '/fonts/noto-serif-bengali-400-v3.000.woff2';
const HIND_400 = '/fonts/hind-siliguri-400-v1.001.woff2';

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
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg';
  if (file.endsWith('.gif')) return 'image/gif';
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

test('Bangla article prose uses Noto Serif Bengali 400 and English sizes', async (t) => {
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
  const requested = [];
  try {
    const readings = {};
    for (const width of [390, 1440]) {
      const page = await browser.newPage({
        viewport: { width, height: width === 390 ? 844 : 1100 },
        colorScheme: 'light',
      });
      const fonts = [];
      page.on('request', (req) => {
        const url = req.url();
        if (/\.woff2(?:\?|$)/i.test(url) || url.includes('/fonts/')) fonts.push(url);
      });
      await page.goto(`${origin}${ARTICLE}`, { waitUntil: 'load', timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);

      const measured = await page.evaluate(() => {
        const title = document.querySelector('.article-title');
        const prose = document.querySelector('.blog-post .prose');
        const para = [...document.querySelectorAll('.blog-post .prose p')].find((el) =>
          /[\u0980-\u09FF]/.test(el.textContent || ''),
        );
        const cs = (el) => {
          const s = getComputedStyle(el);
          return {
            fontFamily: s.fontFamily,
            fontSize: s.fontSize,
            fontWeight: s.fontWeight,
            lineHeight: s.lineHeight,
          };
        };
        const faces = [...document.fonts]
          .filter((f) => /Noto Serif Bengali|Hind Siliguri|Literata/i.test(f.family))
          .map((f) => ({ family: f.family, weight: String(f.weight), status: f.status }));
        return {
          htmlLang: document.documentElement.lang,
          title: cs(title),
          prose: cs(prose),
          para: cs(para),
          faces,
        };
      });

      const client = await page.context().newCDPSession(page);
      await client.send('DOM.enable');
      await client.send('CSS.enable');
      const { root } = await client.send('DOM.getDocument', { depth: 0 });
      const { nodeId } = await client.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: '.blog-post .prose',
      });
      const { fonts: platform } = await client.send('CSS.getPlatformFontsForNode', { nodeId });

      readings[width] = { measured, fonts, platform };

      if (width === 390) {
        await page.screenshot({
          path: '/opt/cursor/artifacts/article_nyay_o_ihsan_390_noto400.png',
          fullPage: false,
        });
      }
      await page.close();
      requested.push(...fonts);
    }

    const mobile = readings[390];
    const desktop = readings[1440];

    for (const [width, row] of Object.entries(readings)) {
      assert.equal(row.measured.htmlLang, 'bn');
      assert.match(row.measured.para.fontFamily, /Noto Serif Bengali/i);
      assert.equal(row.measured.para.fontWeight, '400');
      assert.ok(
        row.fonts.some((url) => url.includes(NOTO_400)),
        `${width}px network missing Noto 400: ${row.fonts.join(', ')}`,
      );
      assert.ok(
        !row.fonts.some((url) => url.includes(HIND_400)),
        `${width}px must not fetch Hind Siliguri on a blog article`,
      );
      const noto400 = row.measured.faces.find(
        (f) => f.family === 'Noto Serif Bengali' && f.weight === '400',
      );
      assert.equal(noto400?.status, 'loaded', `${width}px Noto 400 face status`);
      assert.ok(
        row.platform.some((f) => f.postScriptName === 'NotoSerifBengali-Regular'),
        `${width}px platform fonts: ${JSON.stringify(row.platform)}`,
      );
    }

    assert.equal(mobile.measured.title.fontSize, '32px');
    assert.equal(mobile.measured.prose.fontSize, '19px');
    assert.equal(mobile.measured.para.fontSize, '19px');
    assert.equal(mobile.measured.para.lineHeight, '34.2px');

    assert.equal(desktop.measured.title.fontSize, '42px');
    assert.equal(desktop.measured.prose.fontSize, '21px');
    assert.equal(desktop.measured.para.fontSize, '21px');
    assert.equal(desktop.measured.para.lineHeight, '37.8px');
  } finally {
    await browser.close();
    server.close();
  }
});
