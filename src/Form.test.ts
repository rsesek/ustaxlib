import { ComputedLine, Line } from './Line';
import TaxReturn from './TaxReturn';
import Form from './Form';
import { InconsistencyError, NotFoundError } from './Errors';

test('add and get line', () => {
  const l = new ComputedLine<number>('1', () => 42);

  class TestForm extends Form {
    get name(): string {
      return 'Test Form';
    }

    protected getLines() {
      return [l];
    }
  };

  const f = new TestForm();
  expect(f.getLine('1')).toBe(l);
});

test('get non-existent line', () => {
  class TestForm extends Form {
    get name(): string {
      return 'Test Form';
    }

    protected getLines() {
      return [];
    }
  };

  const f = new TestForm();
  expect(() => f.getLine('1')).toThrow(NotFoundError);
});

test('add duplicate line', () => {
  const l1 = new ComputedLine<number>('1', () => 42);
  const l2 = new ComputedLine<number>('1', () => 36);

  class TestForm extends Form {
    get name(): string {
      return 'Test Form';
    }

    protected getLines() {
      return [l1, l2];
    }
  };

  expect(() => new TestForm()).toThrow(InconsistencyError);
});

test('add line to two forms', () => {
  const l = new ComputedLine<string>('bad', () => 'bad');

  class TestForm1 extends Form {
    get name(): string { return '1'; }

    protected getLines() { return [ l ]; }
  };
  class TestForm2 extends Form {
    get name(): string { return '2'; }

    protected getLines() { return [ l ]; }
  };

  const f1 = new TestForm1();
  expect(() => new TestForm2()).toThrow(InconsistencyError);
});

test('input', () => {
  interface TestInput {
    filingStatus: string;
    money: number;
  };
  class TestForm extends Form<TestInput> {
    get name() { return '1040'; }

    protected getLines() { return []; }
  };

  const f = new TestForm({ filingStatus: 'S', money: 100.0 });
  expect(f.getInput('filingStatus')).toBe('S');
});

test('get value', () => {
  class TestForm extends Form {
    get name() { return 'Form'; }

    protected getLines() {
      return [ new ComputedLine<number>('line', () => 42) ];
    }
  };

  const f = new TestForm();
  const tr = new TaxReturn(2019);
  expect(f.getValue(tr, 'line')).toBe(42);
});
