import test from 'node:test';
import assert from 'node:assert/strict';
import { brisbaneDate, brisbaneDay, canPerformJob, hoursWorked, validWeekStart } from '../src/lib/hr-rules.ts';

test('Brisbane date rolls over ahead of UTC at local midnight', () => {
  const time = new Date('2026-09-23T15:30:00Z');
  assert.equal(brisbaneDate(time), '2026-09-24');
  assert.equal(brisbaneDay(time), 'THU');
});

test('availability weeks start on a real Monday', () => {
  assert.equal(validWeekStart('2026-09-21'), true);
  assert.equal(validWeekStart('2026-09-22'), false);
  assert.equal(validWeekStart('2026-02-30'), false);
});

test('bar staff can fill wait roles but wait staff cannot fill bar roles', () => {
  assert.equal(canPerformJob('bar_staff', 'wait_staff'), true);
  assert.equal(canPerformJob('wait_staff', 'bar_staff'), false);
  assert.equal(canPerformJob('wait_staff', 'all'), true);
});

test('timesheet rounds worked duration to quarters and subtracts break', () => {
  assert.equal(hoursWorked(new Date('2026-09-23T01:00:00Z'),
    new Date('2026-09-23T05:08:00Z'), 30), 3.75);
  assert.equal(hoursWorked(new Date('2026-09-23T01:00:00Z'),
    new Date('2026-09-23T01:01:00Z'), 30), 0);
});
