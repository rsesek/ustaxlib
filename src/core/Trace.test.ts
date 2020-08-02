// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import Form from './Form';
import TaxReturn from './TaxReturn';
import { ComputedLine, InputLine, ReferenceLine } from './Line';
import { Edge, getLastTraceList } from './Trace';

class TestTaxReturn extends TaxReturn {
  readonly constants = undefined;

  get year() { return 2019; }

  get includeJointPersonForms() { return false; }
};

interface Input {
  name: string;
  value: number;
};

class TestForm extends Form<Input> {
  readonly name = 'TF';

  readonly lines = {
    'i1': new InputLine<Input>('name'),
    'i2': new InputLine<Input>('value'),
    'c1': new ComputedLine((tr): string => {
      return `Hello ${this.getInput('name')}`;
    }),
    'c2': new ComputedLine((tr): number => {
      return this.getValue(tr, 'i2') * 0.20;
    }),
    'r2': new ReferenceLine(TestForm as any, 'c2'),
  };
};

describe('tracing', () => {
  const tr = new TestTaxReturn();
  const f = new TestForm({
    name: 'ABC',
    value: 100
  });
  tr.addForm(f);

  test('input line', () => {
    f.getValue(tr, 'i1');
    const trace = getLastTraceList();
    expect(trace).toStrictEqual([ [ 'TF@i1 (Input from name)', 'TF input: name' ] ]);
  });

  test('computed line via input', () => {
    f.getValue(tr, 'c1');
    const trace = getLastTraceList();
    expect(trace).toStrictEqual([ [ 'TF@c1', 'TF input: name' ] ]);
  });

  test('computed line via input line', () => {
    f.getValue(tr, 'c2');
    const trace = getLastTraceList();
    expect(trace).toStrictEqual([
      [ 'TF@c2', 'TF@i2 (Input from value)' ],
      [ 'TF@i2 (Input from value)', 'TF input: value' ]
    ]);
  });

  test('reference line', () => {
    f.getValue(tr, 'r2');
    const trace = getLastTraceList();
    expect(trace).toStrictEqual([
      [ 'TF@r2 (Reference TestForm@c2)', 'TF@c2' ],
      [ 'TF@c2', 'TF@i2 (Input from value)' ],
      [ 'TF@i2 (Input from value)', 'TF input: value' ]
    ]);
  });
});

