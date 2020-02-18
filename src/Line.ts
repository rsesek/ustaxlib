import TaxReturn from './TaxReturn';

export abstract class Line<T> {
  private _id: string;
  private _description?: string;

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

  constructor(id: string, form: string, line: string) {
    super(id, `Reference F${form}.L${line}`);
    this._form = form;
    this._line = line;
  }

  value(tr: TaxReturn): T {
    return tr.getForm(this._form).getLine(this._line).value(tr);
  }
};
