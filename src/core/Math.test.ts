import { clampToZero, undefinedToZero } from './Math';

test('clamp to zero', () => {
  expect(clampToZero(100)).toBe(100);
  expect(clampToZero(-100)).toBe(0);
  expect(clampToZero(0)).toBe(0);
});

test('undefiend to zero', () => {
  expect(undefinedToZero(undefined)).toBe(0);
  expect(undefinedToZero(100)).toBe(100);
});