// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import * as Trace from '../core/Trace';
import { Form, Person, TaxReturn } from '../core';
import { Line, InputLine, ComputedLine, sumLineOfForms } from '../core/Line';
import { undefinedToZero } from '../core/Math';

import Form1099B, { Form1099BRow, Form1099BInput } from './Form1099B';

export enum Form8949Box {
  A = 'A', // Short-term transactions reported on Form(s) 1099-B showing basis was reported to the IRS
  B = 'B', // Short-term transactions reported on Form(s) 1099-B showing basis wasn’t reported to the IRS
  C = 'C', // Short-term transactions not reported to you on Form 1099-B
  D = 'D', // Long-term transactions reported on Form(s) 1099-B showing basis was reported to the IRS
  E = 'E', // Long-term transactions reported on Form(s) 1099-B showing basis wasn’t reported to the IRS
  F = 'F', // Long-term transactions not reported to you on Form 1099-B
};

export interface Form8949Total {
  proceeds: number;
  costBasis: number;
  adjustments: number;
  gainOrLoss: number;
};

class Form8949Line extends Line<Form8949Total> {
  private _box: Form8949Box;
  private _line: keyof Form1099B['lines'];

  constructor(box: Form8949Box) {
    super(`Form 8949 Box ${box} Total`);
    this._box = box;
  }

  value(tr: TaxReturn): Form8949Total {
    Trace.begin(this);

    const f1099bs = tr.findForms(Form1099B);
    const fieldMap: { [key: string]: keyof Form1099BInput } = {
      [Form8949Box.A]: 'shortTermBasisReported',
      [Form8949Box.B]: 'shortTermBasisUnreported',
      [Form8949Box.C]: 'shortTermUnreported',
      [Form8949Box.D]: 'longTermBasisReported',
      [Form8949Box.E]: 'longTermBasisUnreported',
      [Form8949Box.F]: 'longTermUnreported',
    };
    const field: keyof Form1099BInput = fieldMap[this._box];

    const value = {
      proceeds: 0,
      costBasis: 0,
      adjustments: 0,
      gainOrLoss: 0
    };

    for (const f1099b of f1099bs) {
      if (!f1099b.hasInput(field))
        continue;

      const rows = f1099b.getInput(field) as Form1099BRow[];
      for (const row of rows) {
        let { proceeds, costBasis, adjustments } = row;
        adjustments = undefinedToZero(adjustments);
        value.proceeds += proceeds;
        value.costBasis += costBasis;
        value.adjustments += adjustments;
        value.gainOrLoss += proceeds - costBasis + adjustments;
      }
    }

    Trace.end();
    return value;
  }
};

export default class Form8949 extends Form {
  readonly name = '8949';

  readonly supportsMultipleCopies = true;

  readonly lines = {
    'boxA': new Form8949Line(Form8949Box.A),
    'boxB': new Form8949Line(Form8949Box.B),
    'boxC': new Form8949Line(Form8949Box.C),
    'boxD': new Form8949Line(Form8949Box.D),
    'boxE': new Form8949Line(Form8949Box.E),
    'boxF': new Form8949Line(Form8949Box.F),
  };
};
