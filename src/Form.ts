import { Line } from './Line';
import { InconsistencyError, NotFoundError } from './Errors';

export default abstract class Form {
  private _lines: Line<any>[] = [];

  abstract get name(): string;

  constructor() {
    this.getLines().map(this.addLine.bind(this));
  }

  protected abstract getLines(): Line<any>[];

  get allowMultipleCopies(): boolean {
    return false;
  }

  private addLine(line: Line<any>) {
    try {
      this.getLine(line.id);
    } catch {
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
};
