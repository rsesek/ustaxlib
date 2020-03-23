// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import TaxReturn from './TaxReturn';
import Person from './Person';
import Form from './Form';
import { NotFoundError, InconsistencyError } from './Errors';

class TestTaxReturn extends TaxReturn {
  get year() { return 2019; }

  includeJointPersonForms = false;
};

test('does not support Dependents', () => {
  const tr = new TestTaxReturn();
  const p = Person.dependent('Baby');
  expect(() => tr.addPerson(p)).toThrow('Dependents are not supported');
});

test('add more than one Self', () => {
  const tr = new TestTaxReturn();
  const p1 = Person.self('A');
  tr.addPerson(p1);
  const p2 = Person.self('B');
  expect(() => tr.addPerson(p2)).toThrow('Cannot have more than one Self or Spouse');
});

test('add more than one Spouse', () => {
  const tr = new TestTaxReturn();
  const p1 = Person.spouse('A');
  tr.addPerson(p1);
  const p2 = Person.spouse('B');
  expect(() => tr.addPerson(p2)).toThrow('Cannot have more than one Self or Spouse');
});

test('add Self and Spouse', () => {
  const tr = new TestTaxReturn();
  const self = Person.self('Billy Bob');
  const spouse = Person.spouse('Jilly Bob');
  tr.addPerson(self);
  tr.addPerson(spouse);

  expect(tr.getPerson('Billy')).toBe(self);
  expect(tr.getPerson('Jilly')).toBe(spouse);

  expect(() => tr.getPerson('Bob')).toThrow('too imprecise');
});

test('get non-existent person', () => {
  const tr = new TestTaxReturn();
  const self = Person.self('Billy Bob');
  tr.addPerson(self);

  expect(tr.getPerson('Billy Bob')).toBe(self);
  expect(() => tr.getPerson('Jilly')).toThrow('not found');
});

test('single-copy forms', () => {
  class TestForm extends Form<null> {
    readonly name = 'Test Form';
    readonly lines = null;
  };

  const tr = new TestTaxReturn();
  const f = new TestForm();
  tr.addForm(f);
  expect(() => tr.addForm(new TestForm)).toThrow(InconsistencyError);
  expect(tr.getForm(TestForm)).toBe(f);
  expect(tr.findForm(TestForm)).toBe(f);
});

test('multiple-copy forms', () => {
  class TestForm extends Form<null> {
    readonly name = 'Test Form';
    readonly supportsMultipleCopies = true;
    readonly lines = null;
  };

  const tr = new TestTaxReturn();
  const f1 = new TestForm();
  const f2 = new TestForm();
  const f3 = new TestForm();
  tr.addForm(f1);
  tr.addForm(f2);

  expect(() => tr.getForm(TestForm)).toThrow(InconsistencyError);
  expect(() => tr.findForm(TestForm)).toThrow(InconsistencyError);

  const forms = tr.findForms(TestForm);
  expect(forms.length).toBe(2);
  expect(forms).toContain(f1);
  expect(forms).toContain(f2);
  expect(forms).not.toContain(f3);
});

test('get non-existent form', () => {
  class TestForm extends Form<null> {
    readonly name = 'Test Form';
    readonly lines = null;
  }
  const tr = new TestTaxReturn();
  expect(() => tr.getForm(TestForm)).toThrow(NotFoundError);
  expect(tr.findForm(TestForm)).toBeNull();
  expect(tr.findForms(TestForm)).toEqual([]);
});

class PerPersonForm extends Form<PerPersonForm['lines']> {
  private _person?: Person;

  readonly name = 'Per Person';

  readonly supportsMultipleCopies = true;

  readonly lines = {};

  constructor(person?: Person) {
    super(undefined);
    this._person = person;
  }

  person() { return this._person; }
};

test('find forms for person', () => {
  const p1 = Person.self('1');
  const p2 = Person.spouse('2');

  const addFormsToTaxReturn = (tr) => {
    tr.addForm(new PerPersonForm(undefined));
    tr.addForm(new PerPersonForm(undefined));
    tr.addForm(new PerPersonForm(p1));
    tr.addForm(new PerPersonForm(p2));
    tr.addForm(new PerPersonForm(p2));
    tr.addForm(new PerPersonForm(Person.joint));
  };

  const mfsp1 = new TestTaxReturn();
  mfsp1.includeJointPersonForms = false;
  mfsp1.addPerson(p1);
  addFormsToTaxReturn(mfsp1);
  expect(mfsp1.findForms(PerPersonForm).length).toBe(3);

  const mfsp2 = new TestTaxReturn();
  mfsp2.includeJointPersonForms = false;
  mfsp2.addPerson(p2);
  addFormsToTaxReturn(mfsp2);
  expect(mfsp2.findForms(PerPersonForm).length).toBe(4);

  const mfj = new TestTaxReturn();
  mfj.includeJointPersonForms = true;
  mfj.addPerson(p1);
  mfj.addPerson(p2);
  addFormsToTaxReturn(mfj);
  expect(mfj.findForms(PerPersonForm).length).toBe(6);
});
