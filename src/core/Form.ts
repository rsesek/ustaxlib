// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import Person from './Person';
import TaxReturn from './TaxReturn';
import * as Trace from './Trace';
import { Line } from './Line';
import { InconsistencyError, NotFoundError } from './Errors';

export default abstract class Form<I extends object = any> {
  abstract readonly name: string;

  abstract readonly lines: { [key: string]: Line<any> };

  readonly supportsMultipleCopies: boolean = false;

  private readonly _input?: I;

  constructor(input?: I) {
    this._input = input;
  }

  init() {
    for (const id in this.lines) {
      let l = this.lines[id];
      l._id = id;
      l.form = this;
    }
  }

  person(): Person | undefined {
    return undefined;
  }

  getLine<K extends keyof this['lines']>(id: K): this['lines'][K] {
    if (!(id in this.lines))
      throw new NotFoundError(`Form ${this.name} does not have line ${id.toString()}`);
    // This coercion is safe: the method's generic constraint for K ensures
    // a valid key in |lines|, and the abstract declaration of |lines| ensures
    // the correct index type.
    return this.lines[id as any] as this['lines'][K];
  }

  getValue<K extends keyof this['lines']>(tr: TaxReturn, id: K): ReturnType<this['lines'][K]['value']> {
    const line = this.getLine(id);
    return line.value(tr);
  }

  getInput<K extends keyof I>(name: K): I[K] {
    if (!(name in this._input)) {
      throw new NotFoundError(`No input with key ${String(name)} on form ${this.name}`);
    }
    Trace.mark(`${this.name} input: ${String(name)}`);
    return this._input[name];
  }

  hasInput<K extends keyof I>(name: K): boolean {
    return this._input !== undefined && name in this._input;
  }
};

export type FormClass<T extends Form> = new (...args: any[]) => T;

export function isFormT<T extends Form>(form: Form,
                                        formClass: FormClass<T>):
                                            form is T {
  for (let proto = form; proto !== null; proto = Object.getPrototypeOf(proto)) {
    if (proto.constructor === formClass)
      return true;
  }
  return false;
}
