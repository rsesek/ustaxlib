import Form from '../Form';
import TaxReturn from '../TaxReturn';
import { AccumulatorLine, ComputedLine, InputLine, ReferenceLine } from '../Line';
import { NotFoundError, UnsupportedFeatureError } from '../Errors';

import Form1040, { FilingStatus } from './Form1040';
import Form1099DIV from './Form1099DIV';
import Form1099INT from './Form1099INT';
import Form1116 from './Form1116';
import Schedule2 from './Schedule2';

export interface Schedule3Input {
  estimatedTaxPayments?: number;
};

export default class Schedule3 extends Form<Schedule3['_lines'], Schedule3Input> {
  readonly name = 'Schedule 3';

  readonly _lines = {
    // Part 1
    '1': new ComputedLine((tr): number => {
      const f1040 = tr.getForm(Form1040);

      const totalForeignTax = (new AccumulatorLine(Form1099DIV, '7')).value(tr) +
                              (new AccumulatorLine(Form1099INT, '6')).value(tr);
      const limit = f1040.getInput('filingStatus') == FilingStatus.MarriedFilingJoint ? 600 : 300;

      if (totalForeignTax < limit) {
        const sched2l2 = new ReferenceLine(Schedule2, '2', undefined, 0);
        return Math.min(totalForeignTax, f1040.getValue(tr, '12a') + sched2l2.value(tr));
      }
      return tr.getForm(Form1116).getValue(tr, '33');
    }, 'Foreign tax credit'),
    // 2 not supported - Credit for child and dependent care expenses. Attach Form 2441
    // 3 not supported - Education credits from Form 8863, line 19
    // 4 not supported - Retirement savings contributions credit. Attach Form 8880
    // 5 not supported - Residential energy credits. Attach Form 5695
    // 6a not supported - Form 3800
    // 6b not supported - Form 8801
    // 6c not supported - Other nonrefundable credits
    '7': new ComputedLine((tr): number => {
      // Should include 2-6.
      return this.getValue(tr, '1');
    }),

    // Part 2
    '8': new InputLine<Schedule3Input>('estimatedTaxPayments'),
    // 9 not supported - Net premium tax credit. Attach Form 8962
    // 10 not supported - Amount paid with request for extension to file (see instructions)
    // 11 not supported - Excess social security and tier 1 RRTA tax withheld
    // 12 not supported - Credit for federal tax on fuels. Attach Form 4136
    // 13a not supported - Form 2439
    // 13b is reserved
    // 13c not supported - Form 8885
    // 13d not supported - Other refundable credits
    '14': new ComputedLine((tr): number => {
      // Should include 9-13.
      return this.getValue(tr, '8');
    }),
  };
};
