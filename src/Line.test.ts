import { Line, AccumulatorLine, InputLine, ReferenceLine, ComputedLine } from './Line';
import Form from './Form';
import TaxReturn from './TaxReturn';
import { NotFoundError } from './Errors';

class ConstantLine<T> extends Line<T> {
  private _k: T;

  constructor(id: string, k: T) {
    super(id, `Constant ${k}`);
    this._k = k;
  }

  value(tr: TaxReturn): T {
    return this._k;
  }
};

test('computed line', () => {
  const tr = new TaxReturn(2019);
  const l = new ComputedLine<number>('A',
    (taxReturn: TaxReturn, line: ComputedLine<number>): number => {
      expect(taxReturn).toBe(tr);
      expect(line).toBe(l);
      return 42;
    },
    'Computed Line A');
  expect(l.value(tr)).toBe(42);
  expect(l.id).toBe('A');
  expect(l.description).toBe('Computed Line A');
});

test('reference line', () => {
  class TestForm extends Form {
    get name() { return 'Form 1'; }

    protected getLines() {
      return [ new ConstantLine('6b', 12.34) ];
    }
  };

  const tr = new TaxReturn(2019);
  tr.addForm(new TestForm());

  const l1 = new ReferenceLine<number>('C', 'Form 1', '6b');
  expect(l1.value(tr)).toBe(12.34);

  const l2 = new ReferenceLine<number>('x', 'Form 2', '6b');
  expect(() => l2.value(tr)).toThrow(NotFoundError);

  const l3 = new ReferenceLine<number>('y', 'Form 1', '7a');
  expect(() => l3.value(tr)).toThrow(NotFoundError);
});

test('input line', () => {
  interface Input {
    key: string;
    key2?: string;
  }
  class TestForm extends Form {
    get name() { return 'F1'; }

    protected getLines() {
      return [
        new InputLine<Input>('1', 'key'),
        new InputLine<Input>('2', 'key2')
      ];
    }
  };
  const tr = new TaxReturn(2019);
  const f = new TestForm({ 'key': 'value' });

  expect(f.getLine('1').value(tr)).toBe('value');

  const l2 = f.getLine('2');
  expect(() => l2.value(tr)).toThrow(NotFoundError);
});

test('line stack', () => {
  class FormZ extends Form {
    get name() { return 'Z'; }

    protected getLines() {
      return [ new InputLine<any, any>('3', 'input') ];
    }
  };

  class FormZ2 extends Form {
    get name() { return 'Z-2'; }

    protected getLines() {
      return [
        new ComputedLine<number>('2c', (tr: TaxReturn, l: Line<number>): any => {
          return tr.getForm('Z').getLine('3').value(tr) * 0.2;
        })
      ];
    }
  };

  const tr = new TaxReturn(2019);
  tr.addForm(new FormZ({ 'input': 100 }));
  tr.addForm(new FormZ2());

  const l = new ReferenceLine<number>('32', 'Z-2', '2c');
  expect(l.value(tr)).toBe(20);
});

test('accumulator line', () => {
  class TestForm extends Form {
    get name() { return 'Form B'; }

    readonly supportsMultipleCopies = true;

    protected getLines() {
      return [ new ConstantLine<number>('g', 100.25) ]
    }
  };

  const tr = new TaxReturn(2019);
  tr.addForm(new TestForm());
  tr.addForm(new TestForm());
  tr.addForm(new TestForm());

  const l = new AccumulatorLine('line', 'Form B', 'g');
  expect(l.value(tr)).toBe(300.75);
});
