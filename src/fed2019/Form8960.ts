import Form from '../Form';
import TaxReturn from '../TaxReturn';
import { ComputedLine, ReferenceLine } from '../Line';
import { clampToZero } from '../Math';

import Form1040, { FilingStatus } from './Form1040';
import Schedule1 from './Schedule1';

export default class Form8960 extends Form<Form8960['_lines']> {
  readonly name = '8960';

  protected readonly _lines = {
    // Part 1
    // Section 6013 elections not supported.
    '1': new ReferenceLine(Form1040, '2b', 'Taxable interest'),
    '2': new ReferenceLine(Form1040, '3b', 'Ordinary dividends'),
    // 3 not supported - Annuities
    // 4a not supported - Rental real estate, royalties, partnerships, S corporations, trusts, etc
    // 4b not supported - Adjustment for net income or loss derived in the ordinary course of a nonsection 1411 trade or business 
    // 4c not supported - 4a+4b
    '5a': new ComputedLine((tr): number => {
      return (new ReferenceLine(Form1040, '6')).value(tr) +
             (new ReferenceLine(Schedule1, '4', undefined, 0)).value(tr);
    }, 'Net gain or loss'),
    // 5b not supported - Net gain or loss from disposition of property that is not subject to net investment income tax
    // 5c not supported - Adjustment from disposition of partnership interest or S corporation stock
    '5d': new ComputedLine((tr): number => {
      // Should include 5b-5c.
      return this.getValue(tr, '5a');
    }),
    // 6 not supported - Adjustments to investment income for certain CFCs and PFICs
    // 7 not supported - Other modifications to investment income
    '8': new ComputedLine((tr): number => {
      return this.getValue(tr, '1') +
             this.getValue(tr, '2') +
             /*this.getValue(tr, '3') +
             this.getValue(tr, '4c') +*/
             this.getValue(tr, '5d') /*+
             this.getValue(tr, '6') +
             this.getValue(tr, '7')*/;
    }),

    // Part 2
    // 9a not supported - Investment interest expenses
    // 9b not supported - State, local, and foreign income tax
    // 9c not supported - Miscellaneous investment expenses
    // 9d not supported - 9a+9b+9c
    // 10 not supported - Additional modifications
    '11': new ComputedLine(() => 0, 'Total deductions and modifications'),  // Not supported - 9d+10.

    // Part 3
    '12': new ComputedLine((tr): number => this.getValue(tr, '8') - this.getValue(tr, '11'), 'Net investment income'),
    '13': new ReferenceLine(Form1040, '8b', 'Modified adjusted gross income'),
    '14': new ComputedLine((tr): number => {
      return Form8960.filingStatusLimit(tr.getForm(Form1040).getInput('filingStatus'));
    }, 'Threshold'),
    '15': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '13') - this.getValue(tr, '14'))),
    '16': new ComputedLine((tr): number => Math.min(this.getValue(tr, '12'), this.getValue(tr, '15'))),
    '17': new ComputedLine((tr): number => this.getValue(tr, '16') * 0.038, 'Net investment income tax'),

    // 18 - 21 not supported (Estates and Trusts)
  };

  static filingStatusLimit(filingStatus: FilingStatus): number {
    switch (filingStatus) {
      case FilingStatus.MarriedFilingJoint:    return 250000;
      case FilingStatus.MarriedFilingSeparate: return 125000;
      case FilingStatus.Single:                return 200000;
    }
  }
};
