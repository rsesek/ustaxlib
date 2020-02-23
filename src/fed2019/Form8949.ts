import Form from '../Form';
import Person from '../Person';
import TaxReturn from '../TaxReturn';
import { Line, InputLine, ComputedLine, sumLineOfForms } from '../Line';

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
  box: Form8949Box;
  adjustments?: Adjustment[];
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

class Form8949Line extends Line<number> {
  private _box: Form8949Box;
  private _line: keyof Form1099B['lines'];

  constructor(f8949Functor: () => Form8949, line: keyof Form1099B['lines'], description: string) { 
    const box = f8949Functor().getInput('box');
    super(`Form 8949 Box ${box} total of 1099-B ${line} (${description})`);
    this._box = box;
    this._line = line;
  }

  value(tr: TaxReturn): number {
    const f1099bs = matching1099Bs(tr, this._box);
    return sumLineOfForms(tr, f1099bs, this._line);
  }
};

export default class Form8949 extends Form<Form8949['_lines'], Form8949Input> {
  readonly name = '8949';

  readonly supportsMultipleCopies = true;

  protected readonly _lines = {
    'Box': new InputLine<Form8949Input>('box'),
    '2(d)': new Form8949Line(() => this, '1d', 'proceeds'),
    '2(e)': new Form8949Line(() => this, '1e', 'cost'),
    '2(g)': new ComputedLine((tr: TaxReturn): number => {
      const f1099bs = matching1099Bs(tr, this.getInput('box'));
      const adjustments = this.getInput('adjustments').filter((a: Adjustment): boolean => {
        return f1099bs.includes(a.entry);
      });
      return adjustments.reduce((acc, curr) => acc + curr.amount, 0);
    }, 'adjustments')
  };

  static addForms(tr: TaxReturn, adjustments: Adjustment[]) {
    tr.addForm(new Form8949({ box: Form8949Box.A, adjustments }));
    tr.addForm(new Form8949({ box: Form8949Box.B, adjustments }));
    tr.addForm(new Form8949({ box: Form8949Box.C, adjustments }));
    tr.addForm(new Form8949({ box: Form8949Box.D, adjustments }));
    tr.addForm(new Form8949({ box: Form8949Box.E, adjustments }));
    tr.addForm(new Form8949({ box: Form8949Box.F, adjustments }));
  }
};

/*
export interface Adjustment {
  entry: Form1099B;
  code: string;
  amount: number;
};

export interface Form8949Input {
  adjustments?: []Adjustment;
};

export interface Form8949Total {
  proceeds: number;
  costBasis: number;
  adjustmentAmount: number;
  gainOrLoss: number;
};

class Form8949Line extends Line<Form8949Total> {
  private _box: Form8949Box;

  constructor(description: string, box: Form8949Input) {
    super(description);
    this._box = box;
  }

  value(tr: TaxReturn): Form8949Total {
    const lineShortTerm = this._box == Form8949Box.A || this._box == Form8949Box.B || this._box == Form8949Box.C;
    const lineBasisReported = this._box == Form8949Box.A || this._box == Form8949Box.D;

    const f1099bs = tr.findForms(Form1099B);
    const relevant1099bs: Form1099B[] = [];
    for (const form of f1099bs) {
      const gainType = form.getValue(tr, '2');
      const basisReported = form.getValue(tr, '12');

      if (lineBasisReported != basisReported)
        continue;

      if (gainType == GainType.ShortTerm && lineShortTerm) {
        relevant1099bs.push(form);
      } else if (gainType == GainType.LongTerm && !lineShortTerm) {
        relevant1099bs.push(form);
      }
    }

    const sumValues = (line: keyof Form1099B['lines']) =>
        relevant1099bs.map((f: Form1099B): number => f.getValue(tr, line))
          .reduce((acc, curr) => acc + curr, 0);

    const proceeds = sumValues('1d');
    const costBasis = sumValues('1e');

    return {
      proceeds,
      costBasis,
      adjustmentAmount: 0,
      gainOrLoss: costBasis - proceeds,
    };
  }
};

export default class Form8949 extends Form<Form8949['_lines'], Form8949Input> {
  readonly name = '8949';

  protected readonly _lines = {
    boxATotals: new Form8949Line('Short-term basis reported', Form8949Box.A), 
    boxBTotals: new Form8949Line('Short-term basis NOT reported', Form8949Box.B), 
    boxCTotals: new Form8949Line('Short-term unreported', Form8949Box.C), 
    boxDTotals: new Form8949Line('Long-term basis reported', Form8949Box.D), 
    boxETotals: new Form8949Line('Long-term basis NOT reported', Form8949Box.E), 
    boxFTotals: new Form8949Line('Long-term unreported', Form8949Box.F)
  };
};
*/
