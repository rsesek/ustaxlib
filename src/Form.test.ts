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
  class TestForm extends Form {
    get name() { return '1040'; }

    protected getLines() { return []; }
  };
  const f = new TestForm({ 'Filing Status': 'S' });
  expect(f.getInput('Filing Status')).toBe('S');
  expect(() => f.getInput('Unknown')).toThrow(NotFoundError);
});
