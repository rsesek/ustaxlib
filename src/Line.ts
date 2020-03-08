import TaxReturn from './TaxReturn';
import Form, { FormClass } from './Form';

export abstract class Line<T> {
  private _description?: string;

  _id: string;  // _id is set by Form.init().
  form: Form<any, any>;  // Set by Form.init();

  constructor(description?: string) {
    this._description = description;
  }

  get id(): string {
    return this._id;
  }

  get description(): string {
    return this._description;
  }

  abstract value(tr: TaxReturn): T;
};

type ComputeFunc<T> = (tr: TaxReturn) => T;

export class ComputedLine<T> extends Line<T> {
  private _compute: ComputeFunc<T>;

  constructor(compute: ComputeFunc<T>, description?: string) {
    super(description);
    this._compute = compute;
  }

  value(tr: TaxReturn): T {
    return this._compute(tr);
  }
};

export class ReferenceLine<F extends Form<any>,
                           L extends keyof F['lines'],
                           T extends ReturnType<F['lines'][L]['value']>>
                               extends Line<T> {
  private _form: FormClass<F>;
  private _line: L;
  private _fallback?: T;

  // If creating a ReferenceLine and F is the same class as the
  // the one the Line is in, erase |form|'s type with |as any| to
  // keep TypeScript happy.
  constructor(form: FormClass<F>, line: L, description?: string, fallback?: T) {
    super(description || `Reference F${form}.L${line}`);
    this._form = form;
    this._line = line;
    this._fallback = fallback;
  }

  value(tr: TaxReturn): T {
    const form: F = tr.findForm(this._form);
    if (this._fallback !== undefined && !form)
      return this._fallback;
    const value: T = form.getValue(tr, this._line);
    return value;
  }
};

export class InputLine<U = unknown, T extends keyof U = any> extends Line<U[T]> {
  private _input: T;
  private _fallback: U[T];

  form: Form<any, U>;

  constructor(input: T, description?: string, fallback?: U[T]) {
    super(description || `Input from ${input}`);
    this._input = input;
    this._fallback = fallback;
  }

  value(tr: TaxReturn): U[T] {
    if (!this.form.hasInput(this._input) && this._fallback !== undefined)
      return this._fallback;
    return this.form.getInput<T>(this._input);
  }
};

export class AccumulatorLine<F extends Form<any>,
                             L extends keyof F['lines']>
                                 extends Line<number> {
  private _form: FormClass<F>;
  private _line: L;

  constructor(form: FormClass<F>, line: L, description?: string) {
    super(description || `Accumulator F${form}.L${line}`);
    this._form = form;
    this._line = line;
  }

  value(tr): number {
    const forms: F[] = tr.findForms(this._form);
    return sumLineOfForms(tr, forms, this._line);
  }
};

export function sumLineOfForms<F extends Form<any>, L extends keyof F['lines']>(
    tr: TaxReturn, forms: F[], line: L): number {
  const reducer = (acc: number, curr: F) => acc + curr.getValue(tr, line);
  return forms.reduce(reducer, 0);
}
