import { Form } from '../core';
import { TaxReturn } from '../core';
import { Line, AccumulatorLine, ComputedLine, ReferenceLine } from '../core/Line';
import { clampToZero } from '../core/Math';

import Form1040, { FilingStatus } from './Form1040';
import FormW2 from './FormW2';

export default class Form8959 extends Form<Form8959['_lines']> {
  readonly name = '8959';

  protected readonly _lines = {
    '1': new AccumulatorLine(FormW2, '5', 'Medicare wages'),
    // 2 is not supported (Unreported tips from Form 4137)
    // 3 is not supported (Wages from Form 8919)
    '4': new ComputedLine((tr): number => {
      // Should include 2-3.
      return this.getValue(tr, '1');
    }),
    '5': new ComputedLine((tr): number => {
      return Form8959.filingStatusLimit(tr.getForm(Form1040).getInput('filingStatus'));
    }),
    '6': new ComputedLine((tr): number => {
      return clampToZero(this.getValue(tr, '4') - this.getValue(tr, '5'));
    }),
    '7': new ComputedLine((tr): number => {
      return this.getValue(tr, '6') * 0.009;
    }, 'Additional Medicare tax on Medicare wages'),

    // All of Section 2 and 3 skipped.

    '18': new ComputedLine((tr): number => {
      // Should include 13 and 17.
      return this.getValue(tr, '7');
    }),

    '19': new AccumulatorLine(FormW2, '6', 'Medicare tax withheld'),
    '20': new ReferenceLine(Form8959 as any, '1'),
    '21': new ComputedLine((tr): number => {
      return this.getValue(tr, '20') * 0.0145;
    }, 'Regular Medicare withholding on Medicare wages'),
    '22': new ComputedLine((tr): number => {
      return clampToZero(this.getValue(tr, '19') - this.getValue(tr, '21'));
    }, 'Additional Medicare withholding on Medicare wages'),
    // 23 is not supported (Additional Medicare Tax withholding on railroad retirement (RRTA) compensation)
    '24': new ComputedLine((tr): number => {
      // Should include 23.
      return this.getValue(tr, '22');
    }),
  };

  static filingStatusLimit(filingStatus: FilingStatus): number {
    switch (filingStatus) {
      case FilingStatus.Single:                return 200000;
      case FilingStatus.MarriedFilingJoint:    return 250000;
      case FilingStatus.MarriedFilingSeparate: return 125000;
    }
  }
};
