// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

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
