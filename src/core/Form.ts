// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import Person from './Person';
import TaxReturn from './TaxReturn';
import * as Trace from './Trace';
import { Line } from './Line';
import { InconsistencyError, NotFoundError } from './Errors';

export default abstract class Form<L extends { [key: string]: Line<any> },
                                   I = unknown> {
  abstract readonly name: string;

  protected abstract readonly _lines: L;

  readonly supportsMultipleCopies: boolean = false;

  private readonly _input?: I;

  // Avoid using this; prefer the getLine() helpers declared below. This
  // is only exposed for propagating line type information.
  get lines(): L { return this._lines; }

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

  person(): Person | undefined {
    return undefined;
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
    Trace.mark(`${this.name} input: ${name}`);
    return this._input[name];
  }

  hasInput<K extends keyof I>(name: K): boolean {
    return this._input !== undefined && name in this._input;
  }
};

export type FormClass<T extends Form<any>> = new (...args: any[]) => T;

export function isFormT<T extends Form<any>>(form: Form<any>,
                                             formClass: FormClass<T>):
                                                form is T {
  return form.constructor === formClass;
}
