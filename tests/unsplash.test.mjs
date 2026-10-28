import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { unsplashBase, unsplashSized, unsplashSrcset } from '../src/lib/unsplash.js';

const photo = 'https://images.unsplash.com/photo-1542219550-2da790bf52e9?auto=format&fit=crop&w=1600&q=80';

test('Unsplash hotlinks keep the photo URL and drop prior query params', () => {
  assert.equal(unsplashBase(photo), 'https://images.unsplash.com/photo-1542219550-2da790bf52e9');
});

test('Unsplash sizes use Unsplash params, not sharp', () => {
  assert.equal(
    unsplashSized(photo, 800),
    'https://images.unsplash.com/photo-1542219550-2da790bf52e9?w=800&fm=webp&q=75',
  );
  assert.equal(
    unsplashSized(photo, 1200),
    'https://images.unsplash.com/photo-1542219550-2da790bf52e9?w=1200&fm=webp&q=75',
  );
});

test('Unsplash srcset includes 400/800/1200 widths', () => {
  assert.equal(
    unsplashSrcset(photo),
    [
      'https://images.unsplash.com/photo-1542219550-2da790bf52e9?w=400&fm=webp&q=75 400w',
      'https://images.unsplash.com/photo-1542219550-2da790bf52e9?w=800&fm=webp&q=75 800w',
      'https://images.unsplash.com/photo-1542219550-2da790bf52e9?w=1200&fm=webp&q=75 1200w',
    ].join(', '),
  );
});

test('sharp is a production dependency for Astro hosted images', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.ok(pkg.dependencies.sharp);
  assert.equal(pkg.devDependencies?.sharp, undefined);
});
