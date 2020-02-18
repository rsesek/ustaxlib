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
