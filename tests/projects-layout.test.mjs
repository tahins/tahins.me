import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const astro = await readFile(new URL('../src/components/Projects.astro', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');

test('current work stays one ul/li list with H3 titles', () => {
  assert.match(astro, /<ul class="current-projects">/);
  assert.match(astro, /<h3 class="project-title">/);
  assert.match(astro, /<li class:list=\{\['current-project'/);
  assert.equal([...astro.matchAll(/<ul class="current-projects">/g)].length, 1);
});

test('Open projects use a stretched title link; HajjMate does not', () => {
  assert.match(astro, /class="project-stretched"/);
  assert.match(astro, /project\.url \? \(/);
  assert.match(astro, /project\.title/);
});

test('project thumbnails use Astro Picture with alt, not hotlinks', () => {
  assert.match(astro, /import \{ Picture \} from 'astro:assets'/);
  assert.match(astro, /alt=\{alts\[project\.title\]\}/);
  assert.doesNotMatch(astro, /images\.unsplash\.com/);
  assert.match(astro, /project-placeholder/);
  assert.match(astro, /assets\/projects\/todox\.png/);
  assert.match(astro, /assets\/projects\/getbriefly\.png/);
  assert.match(astro, /assets\/projects\/hajjmate\.png/);
  assert.match(astro, /assets\/projects\/quran-map\.png/);
  assert.match(astro, /assets\/projects\/alaap\.png/);
  assert.match(astro, /assets\/projects\/dua-deck\.png/);
  assert.match(astro, /assets\/projects\/gdvs\.png/);
  assert.match(astro, /fallbackFormat: 'webp'/);
  assert.match(astro, /width: 800, height: 500/);
  assert.match(
    astro,
    /Todox: 'Todox home page with the headline The Command Center For Your Life'/,
  );
  assert.match(astro, /getbriefly: 'getbriefly home page with the headline News, simplified'/);
  assert.match(
    astro,
    /HajjMate: 'HajjMate home page with the headline Never miss a step on your sacred journey'/,
  );
  assert.match(
    astro,
    /'Quran Map': 'Quran Map surah list in Bangla, with the Mushaf and memorization modes'/,
  );
  assert.match(astro, /'Dua Deck': 'Dua Deck showing a swipeable dua card in Arabic'/);
  assert.match(
    astro,
    /'Alaap SMS': 'Alaap SMS home page with the headline Your OTPs stay loud. Your promos go quiet'/,
  );
  assert.match(
    astro,
    /Guided Verses on phone, tablet, desktop, and laptop showing a verse with English and Bangla translations/,
  );
  assert.match(css, /\.project-thumb--shot (?:picture|img)[\s\S]*object-position:\s*top/);
  assert.match(css, /\.project-thumb \{[\s\S]*aspect-ratio:\s*1\s*\/\s*1/);
});

test('current-work CSS is mobile-first list, then 2-col, then 3-col cards', () => {
  const start = css.indexOf('.current-projects {');
  const layout = css.slice(start);
  const phone = layout.slice(0, layout.indexOf('@media (min-width: 640px)'));
  const tablet = layout.slice(
    layout.indexOf('@media (min-width: 640px)'),
    layout.indexOf('@media (min-width: 1024px)'),
  );
  assert.match(phone, /grid-template-columns:\s*1fr;/);
  assert.match(phone, /min-height:\s*64px;/);
  assert.match(phone, /\.current-projects \.project-open \{[\s\S]*?display:\s*none/);
  assert.match(layout, /@media \(min-width: 640px\)/);
  assert.match(tablet, /repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(tablet, /\.current-projects \.project-open \{[\s\S]*?display:\s*inline-flex/);
  assert.match(layout, /@media \(min-width: 1024px\)/);
  assert.match(layout, /repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(layout, /aspect-ratio:\s*16\s*\/\s*10/);
  assert.match(layout, /project-stretched::after/);
  assert.match(layout, /\.project-code \{[\s\S]*z-index:\s*2/);
});
