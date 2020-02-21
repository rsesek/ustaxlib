import TaxReturn from './TaxReturn';
import Form from './Form';

export abstract class Line<T> {
  private _id: string;
  private _description?: string;

  form: Form;

  constructor(id: string, description?: string) {
    this._id = id;
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

  constructor(id: string, compute: ComputeFunc<T>, description?: string) {
    super(id, description);
    this._compute = compute;
  }

  value(tr: TaxReturn): T {
    return this._compute(tr, this);
  }
};

export class ReferenceLine<T> extends Line<T> {
  private _form: string;
  private _line: string;

  constructor(id: string, form: string, line: string, description?: string) {
    super(id, description || `Reference F${form}.L${line}`);
    this._form = form;
    this._line = line;
  }

  value(tr: TaxReturn): T {
    return tr.getForm(this._form).getLine(this._line).value(tr);
  }
};

export class InputLine<U = unknown, T extends keyof U = any> extends Line<U[T]> {
  private _input: T;

  form: Form<U>;

  constructor(id: string, input: T, description?: string) {
    super(id, description);
    this._input = input;
  }

  value(tr: TaxReturn): U[T] {
    return this.form.getInput<T>(this._input);
  }
};

export class AccumulatorLine extends Line<number> {
  private _form: string;
  private _line: string;

  constructor(id: string, form: string, line: string, description?: string) {
    super(id, description || `Accumulator F${form}.L${line}`);
    this._form = form;
    this._line = line;
  }

  value(tr: TaxReturn): number {
    const forms = tr.getForms(this._form);
    const reducer = (acc: number, curr: Form) => acc + curr.getValue<number>(tr, this._line);
    return forms.reduce(reducer, 0);
  }
};
