// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import TaxReturn from './TaxReturn';
import * as Trace from './Trace';
import Form, { FormClass } from './Form';

export abstract class Line<T> {
  private _description?: string;

  _id: string;  // _id is set by Form.init().
  form: Form;  // Set by Form.init();

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
    Trace.begin(this);
    const value = this._compute(tr);
    Trace.end();
    return value;
  }
};

export class ReferenceLine<F extends Form,
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
    super(description || `Reference ${form.name}@${line}`);
    this._form = form;
    this._line = line;
    this._fallback = fallback;
  }

  value(tr: TaxReturn): T {
    Trace.begin(this);
    const form: F = tr.findForm(this._form);
    if (this._fallback !== undefined && !form) {
      Trace.end();
      return this._fallback;
    }
    const value: T = form.getValue(tr, this._line);
    Trace.end();
    return value;
  }
};

// SymbolicLine cannot be used for lines defined on F itself. For those cases, use:
//    new ComputedLine((tr) => this.K(tr));
export class SymbolicLine<F extends Form & { [key in K]: ComputeFunc<ReturnType<F[K]>> },
                          K extends keyof F>
                              extends Line<ReturnType<F[K]>> {
  private _form: FormClass<F>;
  private _key: K;

  constructor(form: FormClass<F>, key: K, description?: string) {
    super(description || `Reference ${form.name}/${key}`);
    this._form = form;
    this._key = key;
  }

  value(tr: TaxReturn): ReturnType<F[K]> {
    Trace.begin(this);
    const form: F = tr.findForm(this._form);
    const value = form[this._key](tr);
    Trace.end();
    return value;
  }
}

export class InputLine<U = unknown, T extends keyof U = any> extends Line<U[T]> {
  private _input: T;
  private _fallback: U[T];

  form: Form<U>;

  constructor(input: T, description?: string, fallback?: U[T]) {
    super(description || `Input from ${input}`);
    this._input = input;
    this._fallback = fallback;
  }

  value(tr: TaxReturn): U[T] {
    Trace.begin(this);
    if (!this.form.hasInput(this._input) && this._fallback !== undefined) {
      Trace.end();
      return this._fallback;
    }
    const value = this.form.getInput<T>(this._input);
    Trace.end();
    return value;
  }
};

export class AccumulatorLine<F extends Form,
                             L extends keyof F['lines']>
                                 extends Line<number> {
  private _form: FormClass<F>;
  private _line: L;

  constructor(form: FormClass<F>, line: L, description?: string) {
    super(description || `Accumulator ${form.name}@${line}`);
    this._form = form;
    this._line = line;
  }

  value(tr): number {
    Trace.begin(this);
    const forms: F[] = tr.findForms(this._form);
    const value = sumLineOfForms(tr, forms, this._line);
    Trace.end();
    return value;
  }
};

export class UnsupportedLine extends Line<number> {
  constructor(description?: string) {
    super(description || 'Unsupported');
  }

  value(tr): number {
    // Unsupported lines are deliberately omitted from Trace.
    return 0;
  }
};

export function sumLineOfForms<F extends Form, L extends keyof F['lines']>(
    tr: TaxReturn, forms: F[], line: L): number {
  const reducer = (acc: number, curr: F) => acc + curr.getValue(tr, line);
  return forms.reduce(reducer, 0);
}

export function sumFormLines<F extends Form, L extends keyof F['lines']>(
    tr: TaxReturn, form: F, lines: L[]): number {
  let value = 0;
  for (const line of lines)
    value += form.getValue(tr, line);
  return value;
}
