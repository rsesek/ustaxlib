// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Line } from './Line';

var current: Trace = null;

var traces: Trace[] = [];

export default class Trace {
  private _stack: Set<string>[] = [];
  private _index = 0;
  private _name: string;

  constructor(line: Line<any>) {
    this._name = this._formatLine(line);
    const s = new Set<string>();

    s.add(`Start: ${this._name}`);

    if (current === null) {
      current = this;
    } else {
      ++current._index;
    }

    current._stack.push(s);
  }

  static add(id: string) {
    if (current === null)
      return;
    current._stack[current._index].add(id);
  }

  end() {
    --current._index;
    if (current === this) {
      current = null;
      traces.push(this);
    }
  }

  get traceList(): readonly string[][] {
    return this._stack.map(s => [...s.values()]);
  }

  private _formatLine(line: Line<any>): string {
    if (line.form === undefined)
      return `${line.constructor.name} (${line.description})`;
    return `${line.form.name}-${line.id} (${line.description})`;
  }
};

export function getLastTraceList(): readonly string[][] {
  if (traces.length == 0)
    return null;
  return traces[traces.length - 1].traceList;
}
