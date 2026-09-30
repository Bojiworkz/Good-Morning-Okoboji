import test from 'node:test';
import assert from 'node:assert/strict';
import { selectTopEvents } from '../apps/web/src/lib/editorial/editorial-rank.mjs';

test('headline entertainment precedes a higher raw-scored meeting', () => {
  const rows = [
    { title: 'City council meeting', event_date: '2026-09-30', rank_score: 100 },
    { title: 'Live at the Lake concert', event_date: '2026-09-30', rank_score: 75 },
  ];
  assert.equal(selectTopEvents(rows, { limit: 1 }).selected[0].title, 'Live at the Lake concert');
});
test('a repeated event family occupies only one highlight slot', () => {
  const rows = ['2026-09-29', '2026-09-30'].map(event_date => ({ title: 'Live at the Lake concert', event_date, rank_score: 80 }));
  assert.equal(selectTopEvents(rows).selected.length, 1);
});
test('an empty inventory produces no invented highlights', () => {
  assert.deepEqual(selectTopEvents([]).selected, []);
});
