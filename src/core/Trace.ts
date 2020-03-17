// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Line } from './Line';

var current: Trace = null;

var traces: Trace[] = [];

export type Edge = [string, string];

export default class Trace {
  private _edges: { [key: string]: Edge } = {};
  private _stack: string[] = [];
  private _name: string;

  constructor(line: Line<any>) {
    this._name = this._formatLine(line);

    if (current === null)
      current = this;

    if (current._stack.length != 0) {
      current._addEdge([ current._previousEdge(), this._name ]);
    }

    current._stack.push(this._name);
  }

  static add(id: string) {
    if (current === null)
      return;
    current._addEdge([ current._previousEdge(), id ]);
  }

  end() {
    current._stack.pop();
    if (current === this) {
      current = null;
      traces.push(this);
    }
  }

  get traceList(): readonly Edge[] {
    return Object.values(this._edges);
  }

  private _addEdge(e: Edge) {
    this._edges[`${e[0]}|${e[1]}`] = e;
  }

  private _previousEdge(): string {
    return this._stack[this._stack.length - 1];
  }

  private _formatLine(line: Line<any>): string {
    const description = line.description ? ` (${line.description})` : '';
    if (line.form === undefined)
      return `${line.constructor.name}${description}`;
    return `${line.form.name}-${line.id}${description}`;
  }
};

export function getLastTraceList(): readonly Edge[] {
  if (traces.length == 0)
    return null;
  return traces[traces.length - 1].traceList;
}
