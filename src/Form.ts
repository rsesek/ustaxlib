import TaxReturn from './TaxReturn';
import { Line } from './Line';
import { InconsistencyError, NotFoundError } from './Errors';

export default abstract class Form<L extends { [key: string]: Line<any> },
                                   I = unknown> {
  abstract readonly name: string;

  protected abstract readonly _lines: L;

  readonly supportsMultipleCopies: boolean = false;

  private readonly _input?: I;

  constructor(input?: I) {
    this._input = input;
  }

  init() {
    for (const id in this._lines) {
      let l = this._lines[id];
      l._id = id;
      l.form = this;
    }
  }

  getLine<K extends keyof L>(id: K): L[K] {
    if (!(id in this._lines))
      throw new NotFoundError(`Form ${this.name} does not have line ${id}`);
    return this._lines[id];
  }

  getValue<K extends keyof L>(tr: TaxReturn, id: K): ReturnType<L[K]['value']> {
    const line: L[K] = this.getLine(id);
    return line.value(tr);
  }

  getInput<K extends keyof I>(name: K): I[K] {
    if (!(name in this._input)) {
      throw new NotFoundError(`No input with key ${name} on form ${this.name}`);
    }
    return this._input[name];
  }
};
