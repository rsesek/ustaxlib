import { Form } from '../core';
import { Person } from '../core';
import { TaxReturn } from '../core';
import { Line, InputLine, ComputedLine, sumLineOfForms } from '../core/Line';

import Form1099B, { GainType } from './Form1099B';

export enum Form8949Box {
  A = 'A', // Short-term transactions reported on Form(s) 1099-B showing basis was reported to the IRS
  B = 'B', // Short-term transactions reported on Form(s) 1099-B showing basis wasn’t reported to the IRS
  C = 'C', // Short-term transactions not reported to you on Form 1099-B
  D = 'D', // Long-term transactions reported on Form(s) 1099-B showing basis was reported to the IRS
  E = 'E', // Long-term transactions reported on Form(s) 1099-B showing basis wasn’t reported to the IRS
  F = 'F', // Long-term transactions not reported to you on Form 1099-B
};

export interface Adjustment {
  entry: Form1099B;
  code: string;
  amount: number;
};

export interface Form8949Input {
  adjustments?: Adjustment[];
};

export interface Form8949Total {
  proceeds: number;
  costBasis: number;
  adjustments: number;
  gainOrLoss: number;
};

function matching1099Bs(tr: TaxReturn, box: Form8949Box): Form1099B[] {
  return tr.findForms(Form1099B).filter(f => {
    const gainType: GainType = f.getValue(tr, '2');
    const basisReported: boolean = f.getValue(tr, '12');

    switch (box) {
      case Form8949Box.A:
        return gainType == GainType.ShortTerm && basisReported;
      case Form8949Box.B:
        return gainType == GainType.ShortTerm && !basisReported;
      case Form8949Box.D:
        return gainType == GainType.LongTerm && basisReported;
      case Form8949Box.E:
        return gainType == GainType.LongTerm && !basisReported;
    };

    return false;
  });
}

class Form8949Line extends Line<Form8949Total> {
  private _box: Form8949Box;
  private _line: keyof Form1099B['lines'];

  constructor(box: Form8949Box) {
    super(`Form 8949 Box ${box} Total`);
    this._box = box;
  }

  value(tr: TaxReturn): Form8949Total {
    const f1099bs = matching1099Bs(tr, this._box);
    const proceeds = sumLineOfForms(tr, f1099bs, '1d');
    const costBasis = sumLineOfForms(tr, f1099bs, '1e');
    const f8949 = tr.getForm(Form8949);
    const adjustments = !f8949.hasInput('adjustments') ? 0 :
        f8949.getInput('adjustments')
          .filter(a => f1099bs.includes(a.entry))
          .reduce((acc, curr) => acc + curr.amount, 0);
    return {
      proceeds,
      costBasis,
      adjustments,
      gainOrLoss: proceeds - costBasis + adjustments,
    };
  }
};

export default class Form8949 extends Form<Form8949['_lines'], Form8949Input> {
  readonly name = '8949';

  readonly supportsMultipleCopies = true;

  protected readonly _lines = {
    'boxA': new Form8949Line(Form8949Box.A),
    'boxB': new Form8949Line(Form8949Box.B),
    'boxC': new Form8949Line(Form8949Box.C),
    'boxD': new Form8949Line(Form8949Box.D),
    'boxE': new Form8949Line(Form8949Box.E),
    'boxF': new Form8949Line(Form8949Box.F),
  };
};
