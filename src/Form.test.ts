import { ComputedLine, Line } from './Line';
import TaxReturn from './TaxReturn';
import Form from './Form';
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

/*
abstract class Form2<L extends { [key: string]: Line<any> } , I> {
  abstract readonly name: string;

  protected abstract readonly _lines: L;
  protected abstract readonly _input?: I;

  getLine<K extends keyof L>(key: K): L[K] {
    return this._lines[key];
  }

  getInput<K extends keyof I>(key: K): I[K] {
    return this._input[key];
  }

  getValue<T, K extends keyof L>(tr: TaxReturn, key: K): T {
    const line = this.getLine(key);
    return line.value(tr);
  }
};

class FormG extends Form2<FormG['_lines'], FormG['_input']> {
  readonly name = 'G';

  protected readonly _lines = {
    x: new ComputedLine('moo', () => 42),
    z: new ComputedLine('moo', () => 36),
  };
  protected readonly _input = null;

  private _moo = 42;

  getLineImpl<T, K extends keyof T>(lines: T, k: K): T[K] {
    return lines[k];
  }

  allLines(): FormG['_lines'] {
    return this._lines;
  }

  LINE = k => this.getLineImpl(this._lines, k);

  testLine<K extends keyof ReturnType<FormG['allLines']>>(k: K): any {
    return this.getLineImpl(this._lines, k);
  }
}

test('testing', () => {
  const g = new FormG();
  let v = g.testLine('x'); //g.getLineImpl(g._lines, 'x');
  let v2 = g.getValue(null, 'z');
  throw new Error(`v = ${v2}`);
});
*/
