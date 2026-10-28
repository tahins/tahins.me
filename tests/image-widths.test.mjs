import test from 'node:test';
import assert from 'node:assert/strict';
import { COVER_WIDTHS, servedSize, servedWidths } from '../src/lib/image-widths.js';

test('servedWidths never exceeds the source and skips empty gaps', () => {
  assert.deepEqual(servedWidths({ width: 1400 }, COVER_WIDTHS), [800, 1400]);
  assert.deepEqual(servedWidths({ width: 800 }, COVER_WIDTHS), [800]);
  assert.deepEqual(servedWidths({ width: 600 }, COVER_WIDTHS), [600]);
  assert.deepEqual(servedWidths({ width: 3000 }, COVER_WIDTHS), [800, 1600, 2400]);
  assert.deepEqual(servedSize({ width: 1400, height: 809 }, [800, 1400]), {
    width: 1400,
    height: 809,
  });
});
