import TaxReturn from './TaxReturn';
import Form from './Form';

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

type ComputeFunc<T> = (tr: TaxReturn, l: ComputedLine<T>) => T;

export class ComputedLine<T> extends Line<T> {
  private _compute: ComputeFunc<T>;

  constructor(compute: ComputeFunc<T>, description?: string) {
    super(description);
    this._compute = compute;
  }

  value(tr: TaxReturn): T {
    return this._compute(tr, this);
  }
};

export class ReferenceLine<T> extends Line<T> {
  private _form: string;
  private _line: string;

  constructor(form: string, line: string, description?: string) {
    super(description || `Reference F${form}.L${line}`);
    this._form = form;
    this._line = line;
  }

  value(tr: TaxReturn): T {
    return tr.getForm(this._form).getLine(this._line).value(tr);
  }
};

export class InputLine<U = unknown, T extends keyof U = any> extends Line<U[T]> {
  private _input: T;

  form: Form<any, U>;

  constructor(input: T, description?: string) {
    super(description);
    this._input = input;
  }

  value(tr: TaxReturn): U[T] {
    return this.form.getInput<T>(this._input);
  }
};

export class AccumulatorLine extends Line<number> {
  private _form: string;
  private _line: string;

  constructor(form: string, line: string, description?: string) {
    super(description || `Accumulator F${form}.L${line}`);
    this._form = form;
    this._line = line;
  }

  value(tr: TaxReturn): number {
    const forms = tr.getForms(this._form);
    const reducer = (acc: number, curr: Form<any>) => acc + (curr.getValue(tr, this._line) as number);
    return forms.reduce(reducer, 0);
  }
};
