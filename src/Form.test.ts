import { ComputedLine, Line } from './Line';
import TaxReturn from './TaxReturn';
import Form, { isFormT } from './Form';
import { InconsistencyError, NotFoundError } from './Errors';

test('add and get line', () => {
  const l = new ComputedLine<number>(() => 42);

  class TestForm extends Form<TestForm['_lines']> {
    readonly name = 'Test Form';

    protected readonly _lines = { '1': l };
  };

  const f = new TestForm();
  expect(f.getLine('1')).toBe(l);
});

test('get non-existent line', () => {
  class TestForm extends Form<TestForm['_lines']> {
    readonly name = 'Test';
    protected readonly _lines = {};
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

    protected readonly _lines = null;
  };

  const f = new TestForm({ filingStatus: 'S', money: 100.0 });
  expect(f.getInput('filingStatus')).toBe('S');
});

test('get value', () => {
  class TestForm extends Form<TestForm['_lines']> {
    readonly name = 'Form';

    protected readonly _lines = {
      line: new ComputedLine<number>(() => 42),
    };
  };

  const f = new TestForm();
  const tr = new TaxReturn(2019);
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
    protected readonly _lines = {};
  };
  class FormB extends Form<any> {
    readonly name = 'B';
    protected readonly _lines = {};
  };

  expect(isFormT(new FormA(), FormA)).toBe(true);
  expect(isFormT(new FormB(), FormA)).toBe(false);
  expect(isFormT(new FormA(), FormB)).toBe(false);
  expect(isFormT(new FormB(), FormB)).toBe(true);
});
