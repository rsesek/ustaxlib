// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Person } from '../core';

import TaxReturn from './TaxReturn';
import W2 from './W2';

test('input', () => {
  const p = Person.self('Bob');
  const w2 = new W2({ employer: 'Acme', employee: p, wages: 1000, fedIncomeTax: 100.40 });
  const tr = new TaxReturn();
  tr.addForm(w2);
  expect(w2.getValue(tr, 'c')).toBe('Acme');
  expect(w2.getValue(tr, 'e')).toBe(p);
  expect(w2.getValue(tr, '1')).toBe(1000);
  expect(w2.getValue(tr, '2')).toBe(100.40);
});
