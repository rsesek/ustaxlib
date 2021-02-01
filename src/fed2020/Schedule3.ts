// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Form, TaxReturn } from '../core';
import { AccumulatorLine, ComputedLine, InputLine, ReferenceLine, UnsupportedLine, sumFormLines } from '../core/Line';
import { NotFoundError, UnsupportedFeatureError } from '../core/Errors';

import { Schedule3 as Schedule3_2019 } from '../fed2019';

import { Form1040, FilingStatus } from '.';
import { Form1099DIV } from '.';
import { Form1099INT } from '.';
import { Form1116 } from '.';
import { Schedule2 } from '.';

export default class Schedule3 extends Schedule3_2019 {
  readonly name = 'Schedule 3';

  readonly lines = {
    // Part 1
    '1': new ComputedLine((tr): number => {
      const f1040 = tr.getForm(Form1040);

      const totalForeignTax = (new AccumulatorLine(Form1099DIV, '7')).value(tr) +
                              (new AccumulatorLine(Form1099INT, '6')).value(tr);
      const limit = tr.constants.foreignTaxCreditWithoutForm1116Limit[f1040.filingStatus];

      if (totalForeignTax < limit) {
        const sched2l2 = new ReferenceLine(Schedule2, '2', undefined, 0);
        return Math.min(totalForeignTax, f1040.tax(tr) + sched2l2.value(tr));
      }
      // This should be line 35, to make up for the new lines 22 and 23 in the 2020 F1116,
      // but those would be unsupported. Instead, use the 2019 form and read the old line
      // (33) for the same result value.
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
    '8': new UnsupportedLine('Net premium tax credit. Attach Form 8962'),
    '9': new UnsupportedLine('Amount paid with request for extension to file (see instructions)'),
    '10': new UnsupportedLine('Excess social security and tier 1 RRTA tax withheld'),
    '11': new UnsupportedLine('Credit for federal tax on fuels. Attach Form 4136'),
    '12a': new UnsupportedLine('Form 2439'),
    '12b': new UnsupportedLine('Qualified sick and family leave credits from Schedule H and Form 7202'),
    '12c': new UnsupportedLine('Health coverage credit from Form 8885'),
    '12d': new UnsupportedLine('Other'),
    '12e': new UnsupportedLine('Deferral for certain Schedule H or SE filers'),
    '12f': new ComputedLine((tr) => sumFormLines(tr, this, ['12a', '12b', '12c', '12d', '12e'])),
    '13': new ComputedLine((tr) => sumFormLines(tr, this, ['8', '9', '10', '11', '12f'])),
  };
};
