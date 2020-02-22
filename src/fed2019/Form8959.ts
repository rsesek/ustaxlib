import Form from '../Form';
import TaxReturn from '../TaxReturn';
import { Line, AccumulatorLine, ComputedLine, ReferenceLine } from '../Line';

import Form1040, { FilingStatus } from './Form1040';

export default class Form8959 extends Form<Form8959['_lines']> {
  readonly name = '8959';

  protected readonly _lines = {
    '1': new AccumulatorLine('W-2', '5', 'Medicare wages'),
    // 2 is not supported (Unreported tips from Form 4137)
    // 3 is not supported (Wages from Form 8919)
    '4': new ComputedLine((tr: TaxReturn): number => {
      // Should include 2-3.
      return this.getValue(tr, '1');
    }),
    '5': new ComputedLine((tr: TaxReturn): number => {
      return Form8959.filingStatusLimit(tr.getForm<Form1040>('1040').getInput('filingStatus'));
    }),
    '6': new ComputedLine((tr: TaxReturn): number => {
      const value = this.getValue(tr, '5') - this.getValue(tr, '4');
      return value < 0 ? 0 : value;
    }),
    '7': new ComputedLine((tr: TaxReturn): number => {
      return this.getValue(tr, '6') * 0.009;
    }, 'Additional Medicare tax on Medicare wages'),

    // All of Section 2 and 3 skipped.

    '18': new ComputedLine((tr: TaxReturn): number => {
      // Should include 13 and 17.
      return this.getValue(tr, '7');
    }),

    '19': new AccumulatorLine('W-2', '6', 'Medicare tax withheld'),
    '20': new ReferenceLine<number>('8595', '1'),
    '21': new ComputedLine((tr: TaxReturn): number => {
      return this.getValue(tr, '20') * 0.0145;
    }, 'Regular Medicare withholding on Medicare wages'),
    '22': new ComputedLine((tr: TaxReturn): number => {
      const value = this.getValue(tr, '19') - this.getValue(tr, '21');
      return value < 0 ? 0 : value;
    }, 'Additional Medicare withholding on Medicare wages'),
    // 23 is not supported (Additional Medicare Tax withholding on railroad retirement (RRTA) compensation)
    '24': new ComputedLine((tr: TaxReturn): number => {
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
