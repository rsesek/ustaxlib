// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import Person, { Relation } from './Person';

test('static constructors', () => {
  let p = Person.self('Billy Bob');
  expect(p.name).toBe('Billy Bob');
  expect(p.relation).toBe(Relation.Self);

  p = Person.spouse('Sponge Bob');
  expect(p.name).toBe('Sponge Bob');
  expect(p.relation).toBe(Relation.Spouse);

  p = Person.dependent('Ted Bob');
  expect(p.name).toBe('Ted Bob');
  expect(p.relation).toBe(Relation.Dependent);
});
