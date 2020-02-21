import { Line, AccumulatorLine, InputLine, ReferenceLine, ComputedLine } from './Line';
import Form from './Form';
import TaxReturn from './TaxReturn';
import { NotFoundError } from './Errors';

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
  const tr = new TaxReturn(2019);
  const l = new ComputedLine<number>(
    (taxReturn: TaxReturn, line: ComputedLine<number>): number => {
      expect(taxReturn).toBe(tr);
      expect(line).toBe(l);
      return 42;
    },
    'Computed Line A');
  expect(l.value(tr)).toBe(42);
  expect(l.description).toBe('Computed Line A');
});

test('reference line', () => {
  class TestForm extends Form<TestForm['_lines']> {
    readonly name = 'Form 1';
    protected readonly _lines = {
      '6b': new ConstantLine(12.34)
    };
  };

  const tr = new TaxReturn(2019);
  tr.addForm(new TestForm());

  const l1 = new ReferenceLine<number>('Form 1', '6b');
  expect(l1.value(tr)).toBe(12.34);

  const l2 = new ReferenceLine<number>('Form 2', '6b');
  expect(() => l2.value(tr)).toThrow(NotFoundError);

  const l3 = new ReferenceLine<number>('Form 1', '7a');
  expect(() => l3.value(tr)).toThrow(NotFoundError);
});

test('input line', () => {
  interface Input {
    key: string;
    key2?: string;
  }
  class TestForm extends Form<TestForm['_lines'], Input> {
    readonly name = 'F1';
    protected readonly _lines = {
      '1': new InputLine<Input>('key'),
      '2': new InputLine<Input>('key2')
    };
  };
  const tr = new TaxReturn(2019);
  const f = new TestForm({ 'key': 'value' });
  tr.addForm(f);

  expect(f.getLine('1').value(tr)).toBe('value');
  expect(f.getLine('1').id).toBe('1');

  const l2 = f.getLine('2');
  expect(() => l2.value(tr)).toThrow(NotFoundError);
});

test('line stack', () => {
  class FormZ extends Form<FormZ['_lines'], {'input': number}> {
    readonly name = 'Z';
    protected readonly _lines = {
      '3': new InputLine<any, any>('input')
    }
  };

  class FormZ2 extends Form<FormZ2['_lines']> {
    readonly name = 'Z-2';
    protected readonly _lines = {
      '2c': new ComputedLine<number>((tr: TaxReturn, l: Line<number>): any => {
          return tr.getForm('Z').getLine('3').value(tr) * 0.2;
        })
    };
  };

  const tr = new TaxReturn(2019);
  tr.addForm(new FormZ({ 'input': 100 }));
  tr.addForm(new FormZ2());

  const l = new ReferenceLine<number>('Z-2', '2c');
  expect(l.value(tr)).toBe(20);
});

test('accumulator line', () => {
  class TestForm extends Form<TestForm['_lines']> {
    readonly name = 'Form B';
    readonly supportsMultipleCopies = true;
    protected readonly _lines = {
      g: new ConstantLine<number>(100.25)
    };
  };

  const tr = new TaxReturn(2019);
  tr.addForm(new TestForm());
  tr.addForm(new TestForm());
  tr.addForm(new TestForm());

  const l = new AccumulatorLine('Form B', 'g');
  expect(l.value(tr)).toBe(300.75);
});
