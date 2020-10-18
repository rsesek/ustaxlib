// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Form, TaxReturn } from '../core';
import { AccumulatorLine, ComputedLine, InputLine, ReferenceLine, UnsupportedLine, sumFormLines } from '../core/Line';
import { NotFoundError, UnsupportedFeatureError } from '../core/Errors';

import Form1040, { FilingStatus } from './Form1040';
import Form1099DIV from './Form1099DIV';
import Form1099INT from './Form1099INT';
import Form1116 from './Form1116';
import Schedule2 from './Schedule2';

export interface Schedule3Input {
  estimatedTaxPayments?: number;
};

export default class Schedule3 extends Form<Schedule3Input> {
  readonly name = 'Schedule 3';

  readonly lines = {
    // Part 1
    '1': new ComputedLine((tr): number => {
      const f1040 = tr.getForm(Form1040);

      const totalForeignTax = (new AccumulatorLine(Form1099DIV, '7')).value(tr) +
                              (new AccumulatorLine(Form1099INT, '6')).value(tr);
      const limit = f1040.filingStatus == FilingStatus.MarriedFilingJoint ? 600 : 300;

      if (totalForeignTax < limit) {
        const sched2l2 = new ReferenceLine(Schedule2, '2', undefined, 0);
        return Math.min(totalForeignTax, f1040.getValue(tr, '12a') + sched2l2.value(tr));
      }
      return tr.getForm(Form1116).getValue(tr, '33');
    }, 'Foreign tax credit'),
    '2': new UnsupportedLine('Credit for child and dependent care expenses. Attach Form 2441'),
    '3': new UnsupportedLine('Education credits from Form 8863, line 19'),
    '4': new UnsupportedLine('Retirement savings contributions credit. Attach Form 8880'),
    '5': new UnsupportedLine('Residential energy credits. Attach Form 5695'),
    '6a': new UnsupportedLine('Form 3800'),
    '6b': new UnsupportedLine('Form 8801'),
    '6c': new UnsupportedLine('Other nonrefundable credits'),
    '7': new ComputedLine((tr): number => {
      return sumFormLines(tr, this, ['1', '2', '3', '4', '5', '6a', '6b', '6c']);
    }),

    // Part 2
    '8': new InputLine<Schedule3Input>('estimatedTaxPayments'),
    '9': new UnsupportedLine('Net premium tax credit. Attach Form 8962'),
    '10': new UnsupportedLine('Amount paid with request for extension to file (see instructions)'),
    '11': new UnsupportedLine('Excess social security and tier 1 RRTA tax withheld'),
    '12': new UnsupportedLine('Credit for federal tax on fuels. Attach Form 4136'),
    '13a': new UnsupportedLine('Form 2439'),
    // 13b is reserved
    '13c': new UnsupportedLine('Form 8885'),
    '13d': new UnsupportedLine('Other refundable credits'),
    '14': new ComputedLine((tr): number => {
      return sumFormLines(tr, this, ['8', '9', '10', '11', '12', '13a', '13c', '13d']);
    }),
  };
};
