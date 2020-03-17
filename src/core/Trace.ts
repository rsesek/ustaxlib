// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Line } from './Line';

export type Edge = [string, string];

type Trace = { [key: string]: Edge };

var stack: string[] = [];

var current: Trace = null;
var previous: Trace = null;

export function begin(line: Line<any>) {
  const name = formatLine(line);

  if (current === null)
    current = {} as Trace;

  if (stack.length != 0)
    addEdge([ previousEdge(), name ]);

  stack.push(name);
}

export function mark(id: string) {
  if (current === null)
    return;
  addEdge([ previousEdge(), id ]);
}

export function end() {
  stack.pop();
  if (stack.length == 0) {
    previous = current;
    current = null;
  }
}

export function getLastTraceList(): readonly Edge[] {
  if (previous === null)
    return null;
  return Object.values(previous);
}

function addEdge(e: Edge) {
  current[`${e[0]}|${e[1]}`] = e;
}

function previousEdge(): string {
  return stack[stack.length - 1];
}

function formatLine(line: Line<any>): string {
  const description = line.description ? ` (${line.description})` : '';
  if (line.form === undefined)
    return `${line.constructor.name}${description}`;
  return `${line.form.name}-${line.id}${description}`;
}
