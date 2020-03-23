// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { ComputedLine, Line } from './Line';
import TaxReturn from './TaxReturn';
import Form, { isFormT } from './Form';
import { InconsistencyError, NotFoundError } from './Errors';

class TestTaxReturn extends TaxReturn {
  get year() { return 2019; }
  get includeJointPersonForms() { return true; }
};

test('add and get line', () => {
  const l = new ComputedLine<number>(() => 42);

  class TestForm extends Form<TestForm['lines']> {
    readonly name = 'Test Form';

    readonly lines = { '1': l };
  };

  const f = new TestForm();
  expect(f.getLine('1')).toBe(l);
});

test('get non-existent line', () => {
  class TestForm extends Form<TestForm['lines']> {
    readonly name = 'Test';
    readonly lines = {};
  };

  const f = new TestForm();
  const fAsAny: Form<any> = f;
  expect(() => fAsAny.getLine('line')).toThrow(NotFoundError);

  //TYPEERROR:
  //expect(() => f.getLine('line')).toThrow(NotFoundError);
});

test('input', () => {
  interface TestInput {
    filingStatus: string;
    money: number;
  };
  class TestForm extends Form<any, TestInput> {
    readonly name = '1040';

    readonly lines = null;
  };

  const f = new TestForm({ filingStatus: 'S', money: 100.0 });
  expect(f.getInput('filingStatus')).toBe('S');
});

test('get value', () => {
  class TestForm extends Form<TestForm['lines']> {
    readonly name = 'Form';

    readonly lines = {
      line: new ComputedLine<number>(() => 42),
    };
  };

  const f = new TestForm();
  const tr = new TestTaxReturn();
  expect(f.getValue(tr, 'line')).toBe(42);

  //TYPEERROR:
  //let s: string = f.getValue(tr, 'line');

  const fAsAny: Form<any> = f;
  expect(() => fAsAny.getValue(tr, 'other')).toThrow(NotFoundError);
  //TYPEERROR:
  //expect(() => f.getValue(tr, 'other')).toThrow(NotFoundError);
});

test('form types', () => {
  class FormA extends Form<any> {
    readonly name = 'A';
    readonly lines = {};
  };
  class FormB extends Form<any> {
    readonly name = 'B';
    readonly lines = {};
  };

  expect(isFormT(new FormA(), FormA)).toBe(true);
  expect(isFormT(new FormB(), FormA)).toBe(false);
  expect(isFormT(new FormA(), FormB)).toBe(false);
  expect(isFormT(new FormB(), FormB)).toBe(true);
});
