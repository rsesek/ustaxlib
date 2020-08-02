// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Form, TaxReturn } from '../core';
import { AccumulatorLine, ComputedLine, ReferenceLine, UnsupportedLine, sumFormLines } from '../core/Line';
import { Literal, clampToZero } from '../core/Math';

import Form1040, { QDCGTaxWorksheet, FilingStatus } from './Form1040';
import Form1099INT from './Form1099INT';
import Schedule1 from './Schedule1';
import Schedule2 from './Schedule2';
import Schedule3 from './Schedule3';
import ScheduleD, { ScheduleDTaxWorksheet } from './ScheduleD';

export default class Form6251 extends Form {
  readonly name = '6251';

  readonly lines = {
    // Part I
    '1': new ComputedLine((tr): number => {
      const f1040 = tr.getForm(Form1040);
      const l11b = f1040.getValue(tr, '11b');
      if (l11b > 0)
        return l11b;
      return f1040.getValue(tr, '8b') - f1040.getValue(tr, '9') - f1040.getValue(tr, '10');
    }),
    '2a': new ComputedLine((tr): number => {
      // Not supported: Schedule A, line 7.
      return tr.getForm(Form1040).getValue(tr, '9');
    }),
    '2b': new ReferenceLine(Schedule1, '1', 'Tax refund', 0),  // Not supported - line 8 SALT.
    '2c': new UnsupportedLine('Investment interest expense'),
    '2d': new UnsupportedLine('Depletion'),
    '2e': new UnsupportedLine('Net operating loss deduction'),
    '2f': new UnsupportedLine('Alternative tax net operating loss deduction'),
    '2g': new AccumulatorLine(Form1099INT, '9', 'Interest from specified private activity bonds exempt from the regular tax'),
    '2h': new UnsupportedLine('Qualified small business stock'),
    '2i': new UnsupportedLine('Exercise of incentive stock options'),
    '2j': new UnsupportedLine('Estates and trusts (amount from Schedule K-1 (Form 1041), box 12, code A)'),
    '2k': new UnsupportedLine('Disposition of property'),
    '2l': new UnsupportedLine('Depreciation on assets placed in service after 1986'),
    '2m': new UnsupportedLine('Passive activities'),
    '2n': new UnsupportedLine('Loss limitations'),
    '2o': new UnsupportedLine('Circulation costs'),
    '2p': new UnsupportedLine('Long-term contracts'),
    '2q': new UnsupportedLine('Mining costs'),
    '2r': new UnsupportedLine('Research and experimental costs'),
    '2s': new UnsupportedLine('Income from certain installment sales before January 1, 1987'),
    '2t': new UnsupportedLine('Intangible drilling costs preference'),
    '3': new UnsupportedLine('Other adjustments'),
    '4': new ComputedLine((tr): number => {
      return sumFormLines(tr, this, ['1', '2a', '2b', '2c', '2d', '2e', '2f', '2g', '2h', '2i', '2j', '2k', '2l', '2m', '2n', '2o', '2p', '2q', '2r', '2s', '2t', '3']);
    }, 'Alternative minimum taxable income'),

    // Part II
    '5': new ComputedLine((tr): number => {
      const fs = tr.getForm(Form1040).filingStatus;
      const exemption = tr.constants.amt.exemption[fs];
      const phaseout = tr.constants.amt.phaseout[fs];

      const l4 = this.getValue(tr, '4');
      if (l4 < phaseout)
        return exemption;

      // Exemption worksheet:
      const wl1 = exemption;
      const wl2 = l4;
      const wl3 = phaseout;
      const wl4 = clampToZero(wl2 - wl3);
      const wl5 = wl4 * Literal(0.25);
      const wl6 = clampToZero(wl1 - wl5);
      return wl6;
    }),
    '6': new ComputedLine((tr): number => {
      return clampToZero(this.getValue(tr, '4') - this.getValue(tr, '5'));
    }),
    '7': new ComputedLine((tr): number => {
      // Not supported - Form 2555.
      // Not supported - Form1040 directly reporting cap gains on line 6.

      const f1040 = tr.getForm(Form1040);

      let part3 = f1040.getValue(tr, '3a') > 0;

      const schedD = tr.findForm(ScheduleD);
      if (schedD) {
        const flag = schedD.getValue(tr, '15') > 0 && schedD.getValue(tr, '16') > 0;
        part3 = part3 || flag;
      }

      if (part3)
        return this.getValue(tr, '40');

      return computeAmtTax(tr, this.getValue(tr, '6'));
    }),
    '8': new ReferenceLine(Schedule3, '1', 'Alternative minimum tax foreign tax credit'),  // Not supported - AMT FTC recalculation
    '9': new ComputedLine((tr): number => {
      return this.getValue(tr, '7') - this.getValue(tr, '8');
    }, 'Tentative minimum tax'),
    '10': new ComputedLine((tr): number => {
      let value = tr.getForm(Form1040).getValue(tr, '12a');
      const sched2 = tr.findForm(Schedule2);
      if (sched2) {
        value += sched2.getValue(tr, '2');
      }
      // Not supported - subtracting Schedule3@1 for the AMT FTC.
      return value;
    }),
    '11': new ComputedLine((tr): number => {
      return clampToZero(this.getValue(tr, '9') - this.getValue(tr, '10'));
    }, 'AMT'),

    // Part III
    '12': new ReferenceLine(Form6251 as any, '6'),
    '13': new ComputedLine((tr): number => {
      const schedDTW = tr.findForm(ScheduleDTaxWorksheet);
      if (schedDTW)
        return schedDTW.getValue(tr, '13');

      const qdcgtw = tr.getForm(QDCGTaxWorksheet);
      return qdcgtw.getValue(tr, '6');
    }),
    '14': new ReferenceLine(ScheduleD, '19', undefined, 0),
    '15': new ComputedLine((tr): number => {
      const value = this.getValue(tr, '13') + this.getValue(tr, '14');
      const schedDTW = tr.findForm(ScheduleDTaxWorksheet);
      if (schedDTW)
        return Math.min(value, schedDTW.getValue(tr, '10'));

      return value;
    }),
    '16': new ComputedLine((tr): number => Math.min(this.getValue(tr, '12'), this.getValue(tr, '15'))),
    '17': new ComputedLine((tr): number => this.getValue(tr, '12') - this.getValue(tr, '16')),
    '18': new ComputedLine((tr): number => computeAmtTax(tr, this.getValue(tr, '17'))),
    '19': new ComputedLine((tr): number => {
      const fs = tr.getForm(Form1040).filingStatus;
      return tr.constants.capitalGains.rate0MaxIncome[fs];
    }),
    '20': new ComputedLine((tr): number => {
      const schedDTW = tr.findForm(ScheduleDTaxWorksheet);
      if (schedDTW)
        return clampToZero(schedDTW.getValue(tr, '14'));

      const qdcgtw = tr.getForm(QDCGTaxWorksheet);
      return clampToZero(qdcgtw.getValue(tr, '7'));
    }),
    '21': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '19') - this.getValue(tr, '20'))),
    '22': new ComputedLine((tr): number => Math.min(this.getValue(tr, '12'), this.getValue(tr, '13'))),
    '23': new ComputedLine((tr): number => Math.min(this.getValue(tr, '21'), this.getValue(tr, '22'))),
    '24': new ComputedLine((tr): number => this.getValue(tr, '22') - this.getValue(tr, '23')),
    '25': new ComputedLine((tr): number => {
      const fs = tr.getForm(Form1040).filingStatus;
      return tr.constants.capitalGains.rate15MaxIncome[fs];
    }),
    '26': new ReferenceLine(Form6251 as any, '21'),
    '27': new ComputedLine((tr): number => {
      const schedDTW = tr.findForm(ScheduleDTaxWorksheet);
      if (schedDTW)
        return clampToZero(schedDTW.getValue(tr, '21'));

      const qdcgtw = tr.getForm(QDCGTaxWorksheet);
      return clampToZero(qdcgtw.getValue(tr, '7'));
    }),
    '28': new ComputedLine((tr): number => this.getValue(tr, '26') + this.getValue(tr, '27')),
    '29': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '25') - this.getValue(tr, '28'))),
    '30': new ComputedLine((tr): number => Math.min(this.getValue(tr, '24'), this.getValue(tr, '29'))),
    '31': new ComputedLine((tr): number => this.getValue(tr, '30') * 0.15),
    '32': new ComputedLine((tr): number => this.getValue(tr, '23') + this.getValue(tr, '30')),
    '33': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '22') - this.getValue(tr, '32'))),
    '34': new ComputedLine((tr): number => this.getValue(tr, '33') * 0.20),
    '35': new ComputedLine((tr): number => this.getValue(tr, '17') + this.getValue(tr, '32') + this.getValue(tr, '33')),
    '36': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '12') - this.getValue(tr, '35'))),
    '37': new ComputedLine((tr): number => this.getValue(tr, '36') * 0.25),
    '38': new ComputedLine((tr): number => sumFormLines(tr, this, ['18', '31', '34', '37'])),
    '39': new ComputedLine((tr): number => computeAmtTax(tr, this.getValue(tr, '12'))),
    '40': new ComputedLine((tr): number => Math.min(this.getValue(tr, '38'), this.getValue(tr, '39'))),
  };
};

function computeAmtTax(tr: TaxReturn, amount) {
  const fs = tr.getForm(Form1040).filingStatus;
  const limit = tr.constants.amt.limitForRate28Percent[fs];
  const sub = limit * 0.02;  // Difference between the two rates.

  if (amount < limit)
    return amount * Literal(0.26);
  return (amount * Literal(0.28)) - sub;
}
