// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Form, Person, TaxReturn } from '../core';
import { AccumulatorLine, ComputedLine, InputLine, UnsupportedLine } from '../core/Line';
import { Literal, clampToZero } from '../core/Math';

import Form1040 from './Form1040';
import Form1099DIV from './Form1099DIV';
import ScheduleD from './ScheduleD';

export interface Form8995REITInput {
  qualifiedReitDividendCarryforward?: number;
};

// Dividends from REITs get preferential tax treatment, but the form used to
// calculate that differs based off taxable income amounts. But the QBI
// computation for RETIs is the same. This just models the REIT portion.
export default class Form8995REIT extends Form {
  readonly name = '8995 REIT';

  // This uses line numbers from 8995-A.
  readonly lines = {
    // 1-26 not supported
    '27': new UnsupportedLine('Total qualified business income component'),
    '28': new AccumulatorLine(Form1099DIV, '5', 'Qualified REIT dividends'),
    '29': new InputLine<Form8995REITInput>('qualifiedReitDividendCarryforward', undefined, 0),
    '30': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '28') + this.getValue(tr, '29'))),
    '31': new ComputedLine((tr): number => this.getValue(tr, '30') * Literal(0.20), 'REIT and PTP component'),
    '32': new ComputedLine((tr): number => this.getValue(tr, '27') + this.getValue(tr, '31'), 'QBI deduction before limitation'),
    '33': new ComputedLine((tr): number => {
      const f1040 = tr.getForm(Form1040);
      return f1040.adjustedGrossIncome(tr) - f1040.deduction(tr);
    }, 'Taxable income before deduction'),
    '34': new ComputedLine((tr): number => {
      const f1040 = tr.getForm(Form1040);

      let value = f1040.qualifiedDividends(tr);

      const schedD = tr.findForm(ScheduleD);
      if (schedD) {
        value += Math.min(
          clampToZero(schedD.getValue(tr, '15')),
          clampToZero(schedD.getValue(tr, '16')));
      } else {
        value += f1040.capitalGainOrLoss(tr);
      }

      return value;
    }, 'Net capital gain'),
    '35': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '33') - this.getValue(tr, '34'))),
    '36': new ComputedLine((tr): number => this.getValue(tr, '35') * Literal(0.20), 'Income limitation'),
    '37': new ComputedLine((tr): number => Math.min(this.getValue(tr, '32'), this.getValue(tr, '36'))),
    '38': new UnsupportedLine('DPAD under section 199A(g) allocated from an agricultural or horticultural cooperative'),
    '39': new ComputedLine((tr): number => this.getValue(tr, '37') + this.getValue(tr, '38')),
    '40': new ComputedLine((tr): number => Math.min(0, this.getValue(tr, '28') + this.getValue(tr, '29')), 'Total qualified REIT dividends and PTP loss carryforward.'),
  };
};
