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
});

test('current-work CSS is mobile-first list, then 2-col, then 3-col cards', () => {
  const start = css.indexOf('.current-projects {');
  const layout = css.slice(start);
  assert.match(layout, /grid-template-columns:\s*1fr;/);
  assert.match(layout, /min-height:\s*64px;/);
  assert.match(layout, /@media \(min-width: 640px\)/);
  assert.match(layout, /repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(layout, /@media \(min-width: 1024px\)/);
  assert.match(layout, /repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(layout, /aspect-ratio:\s*16\s*\/\s*10/);
  assert.match(layout, /project-stretched::after/);
  assert.match(layout, /\.project-code \{[\s\S]*z-index:\s*2/);
});
