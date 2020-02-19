import { Line } from './Line';
import { InconsistencyError, NotFoundError } from './Errors';

export default abstract class Form<I = unknown> {
  private _lines: Line<any>[] = [];
  private _input?: I;

  abstract get name(): string;

  constructor(input?: I) {
    this._input = input;
    this.getLines().map(this.addLine.bind(this));
  }

  protected abstract getLines(): Line<any>[];

  get allowMultipleCopies(): boolean {
    return false;
  }

  private addLine(line: Line<any>) {
    if (line.form !== undefined) {
      throw new InconsistencyError('Line is already in a Form');
    }
    try {
      this.getLine(line.id);
    } catch {
      line.form = this;
      this._lines.push(line);
      return;
    }
    throw new InconsistencyError('Cannot add a line with a duplicate identifier');
  }

  getLine(id: string): Line<any> {
    const lines = this._lines.filter(l => l.id === id);
    if (lines.length == 0) {
      throw new NotFoundError(id);
    }
    return lines[0];
  }

  getInput<K extends keyof I>(name: K): I[K] {
    if (!(name in this._input)) {
      throw new NotFoundError(`No input with key ${name} on form ${this.name}`);
    }
    return this._input[name];
  }
};
