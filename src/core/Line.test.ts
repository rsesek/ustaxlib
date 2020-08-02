// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Line, AccumulatorLine, InputLine, ReferenceLine, ComputedLine } from './Line';
import Form, { FormClass } from './Form';
import TaxReturn from './TaxReturn';
import { NotFoundError } from './Errors';

class TestTaxReturn extends TaxReturn {
  readonly constants = undefined;
  get year() { return 2019; }
  get includeJointPersonForms() { return false; }
};

class ConstantLine<T> extends Line<T> {
  private _k: T;

  constructor(k: T) {
    super(`Constant ${k}`);
    this._k = k;
  }

  value(tr: TaxReturn): T {
    return this._k;
  }
};

test('computed line', () => {
  const tr = new TestTaxReturn();
  const l = new ComputedLine<number>(
    (taxReturn: TaxReturn): number => {
      expect(taxReturn).toBe(tr);
      return 42;
    },
    'Computed Line A');
  expect(l.value(tr)).toBe(42);
  expect(l.description).toBe('Computed Line A');
});

test('reference line', () => {
  class TestForm extends Form {
    readonly name = 'Form 1';
    readonly lines = {
      '6b': new ConstantLine(12.34),
      's': new ConstantLine('abc'),
    };
  };

  const tr = new TestTaxReturn();
  tr.addForm(new TestForm());

  const l1 = new ReferenceLine(TestForm, '6b');
  let n: number = l1.value(tr);
  expect(n).toBe(12.34);

  const l2 = new ReferenceLine(TestForm, 's');
  let s: string = l2.value(tr);
  expect(s).toBe('abc');

  //TYPEERROR:
  //const l3 = new ReferenceLine(TestForm, '7a');
  //let n2: string = l1.value(tr);
  //let s2: number = l2.value(tr);
});

test('self reference line', () => {
  class OtherForm extends Form {
    readonly name = 'Form A';
    readonly lines = {
      '6c': new ConstantLine(55)
    };
  };
  class TestForm extends Form {
    readonly name = 'Form 1';
    readonly lines = {
      'a': new ConstantLine(100.2),
      'b': new ReferenceLine(OtherForm, '6c'),
      'c': new ReferenceLine((TestForm as unknown) as FormClass<Form>, 'b'),
      'd': new ReferenceLine(TestForm as any, 'b'),
    };
  };

  const tr = new TestTaxReturn();
  const f = new TestForm();
  tr.addForm(f);
  tr.addForm(new OtherForm());

  expect(f.getValue(tr, 'a')).toBe(100.2);
  expect(f.getValue(tr, 'b')).toBe(55);
  expect(f.getValue(tr, 'c')).toBe(55);
  expect(f.getValue(tr, 'd')).toBe(55);
});

test('input line', () => {
  interface Input {
    key: string;
    key2?: string;
  }
  class TestForm extends Form<Input> {
    readonly name = 'F1';
    readonly lines = {
      '1': new InputLine<Input>('key'),
      '2': new InputLine<Input>('key2'),
      '3': new InputLine<Input>('key2', undefined, 'FALLBACK')
    };
  };
  const tr = new TestTaxReturn();
  const f = new TestForm({ 'key': 'value' });
  tr.addForm(f);

  expect(f.getLine('1').value(tr)).toBe('value');
  expect(f.getLine('1').id).toBe('1');

  const l2 = f.getLine('2');
  expect(() => l2.value(tr)).toThrow(NotFoundError);

  expect(f.getLine('3').value(tr)).toBe('FALLBACK');
});

test('line stack', () => {
  class FormZ extends Form<{'input': number}> {
    readonly name = 'Z';
    readonly lines = {
      '3': new InputLine<any, any>('input')
    }
  };

  class FormZ2 extends Form {
    readonly name = 'Z-2';
    readonly lines = {
      '2c': new ComputedLine<number>((tr: TaxReturn): any => {
          return tr.getForm(FormZ).getLine('3').value(tr) * 0.2;
        })
    };
  };

  const tr = new TestTaxReturn();
  tr.addForm(new FormZ({ 'input': 100 }));
  tr.addForm(new FormZ2());

  const l = new ReferenceLine(FormZ2, '2c');
  expect(l.value(tr)).toBe(20);
});

test('accumulator line', () => {
  class TestForm extends Form {
    readonly name = 'Form B';
    readonly supportsMultipleCopies = true;
    readonly lines = {
      g: new ConstantLine<number>(100.25)
    };
  };

  const tr = new TestTaxReturn();
  tr.addForm(new TestForm());
  tr.addForm(new TestForm());
  tr.addForm(new TestForm());

  const l = new AccumulatorLine(TestForm, 'g');
  expect(l.value(tr)).toBe(300.75);
});
