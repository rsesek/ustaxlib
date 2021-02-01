// Copyright 2021 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { TaxReturn } from '../core';
import { Line, AccumulatorLine, ComputedLine, ReferenceLine, SymbolicLine, UnsupportedLine, sumFormLines, sumLineOfForms } from '../core/Line';
import { UnsupportedFeatureError } from '../core/Errors';
import { clampToZero, reduceBySum, undefinedToZero } from '../core/Math';

import { Form1040 as Form1040_2019, QDCGTaxWorksheet as QDCGTaxWorksheet_2019 } from '../fed2019';

import { computeTax } from '.';
import { Form1099DIV } from '.';
import { Form1099INT } from '.';
import { Form1099R, Box7Code } from '.';
import { Form8606 } from '.';
import { Form8959 } from '.';
import { Schedule1 } from '.';
import { Schedule2 } from '.';
import { Schedule3 } from '.';
import { ScheduleD } from '.';
import { W2 } from '.';

export default class Form1040 extends Form1040_2019 {
  adjustedGrossIncome(tr: TaxReturn): number {
    return this.getValue(tr, '9') - this.getValue(tr, '10c');
  }

  totalIncome(tr: TaxReturn): number {
    return sumFormLines(tr, this, ['1', '2b', '3b', '4b', '5b', '6b', '7', '8']);
  }

  taxableIncome(tr: TaxReturn): number {
    return clampToZero(this.getValue(tr, '11') - this.getValue(tr, '14'));
  }

  readonly lines = {
    '1': new AccumulatorLine(W2, '1', 'Wages, salaries, tips, etc.'),
    '2a': new ComputedLine((tr): number => {
      const value = (new AccumulatorLine(Form1099INT, '8')).value(tr) +
                    (new AccumulatorLine(Form1099DIV, '11')).value(tr);
      return value;
    }, 'Tax-exempt interest'),
    '2b': new ComputedLine((tr) => this.taxableInterest(tr), 'Taxable interest'),
    '3a': new AccumulatorLine(Form1099DIV, '1b', 'Qualified dividends'),
    '3b': new AccumulatorLine(Form1099DIV, '1a', 'Ordinary dividends'),
    '4a': new ComputedLine((tr): number => {
      const f1099Rs = tr.findForms(Form1099R).filter(f => !f.getValue(tr, '7').includes(Box7Code.G));
      return sumLineOfForms(tr, f1099Rs, '1');
    }, 'IRA distributions'),
    '4b': new ComputedLine((tr): number => {
      const f8606s = tr.findForms(Form8606);
      return sumLineOfForms(tr, f8606s, '15c') + sumLineOfForms(tr, f8606s, '18');
    }, 'IRA distributions, taxable amount'),
    '5a': new UnsupportedLine('Pensions and annuities'),
    '5b': new UnsupportedLine('Pensions and annuities, taxable amount'),
    '6a': new UnsupportedLine('Social security benefits'),
    '6b': new UnsupportedLine('Social security benefits, taxable amount'),

    '7': new ComputedLine((tr) => this.capitalGainOrLoss(tr), 'Capital gain/loss'),

    '8': new ReferenceLine(Schedule1, '9', 'Other income from Schedule 1', 0),

    '9': new ComputedLine((tr) => this.totalIncome(tr), 'Total income'),

    '10a': new ReferenceLine(Schedule1, '22', 'Adjustments to income', 0),
    '10b': new UnsupportedLine('Charitable contributions if you take the standard deduction'),
    '10c': new ComputedLine((tr) => sumFormLines(tr, this, ['10a', '10b']), 'Total adjustments to income'),

    '11': new ComputedLine((tr) => this.adjustedGrossIncome(tr), 'Adjusted gross income'),

    '12': new ComputedLine((tr) => this.deduction(tr), 'Deductions'),

    '13': new ComputedLine((tr) => this.qualifiedBusinessIncomeDeduction(tr), 'Qualified business income deduction'),

    '14': new ComputedLine((tr) => sumFormLines(tr, this, ['12', '13'])),

    '15': new ComputedLine((tr) => this.taxableIncome(tr), 'Taxable income'),

    '16': new ComputedLine((tr) => this.tax(tr), 'Tax'),

    '17': new ReferenceLine(Schedule2, '3', 'Additional tax', 0),

    '18': new ComputedLine((tr) => sumFormLines(tr, this, ['16', '17'])),

    '19': new UnsupportedLine('Child tax credit'),

    '20': new ReferenceLine(Schedule3, '7', undefined, 0),

    '21': new ComputedLine((tr) => sumFormLines(tr, this, ['19', '20'])),

    '22': new ComputedLine((tr) => clampToZero(this.getValue(tr, '18') - this.getValue(tr, '21'))),

    '23': new ReferenceLine(Schedule2, '10', undefined, 0),

    '24': new ComputedLine((tr) => sumFormLines(tr, this, ['22', '23']), 'Total tax'),

    '25a': new AccumulatorLine(W2, '2', 'Withholding from W-2'),
    '25b': new ComputedLine((tr) => {
      const fedTaxWithheldBoxes = [
        new AccumulatorLine(Form1099R, '4'),
        new AccumulatorLine(Form1099DIV, '4'),
        new AccumulatorLine(Form1099INT, '4'),
      ];
      return fedTaxWithheldBoxes.reduce((acc, cur) => acc + cur.value(tr), 0);
    }, 'Withholding from 1099'),
    '25c': new ComputedLine((tr) => {
      const f8959 = tr.findForm(Form8959)
      if (f8959) {
        return f8959.getValue(tr, '24');
      }
      // K-1@25c too.
      return 0;
    }, 'Withholding from other forms'),
    '25d': new ComputedLine((tr) => sumFormLines(tr, this, ['25a', '25b', '25c']), 'Federal income tax withheld'),

    '26': new UnsupportedLine('Estimated tax payments'),

    '27': new UnsupportedLine('Earned income credit (EIC)'),
    '28': new UnsupportedLine('Additional child tax credit. Attach Schedule 8812'),
    '29': new UnsupportedLine('American opportunity credit from Form 8863, line 8'),
    '30': new UnsupportedLine('Recovery rebate credit'),

    '31': new ReferenceLine(Schedule3, '13', undefined, 0),

    '32': new ComputedLine((tr) => sumFormLines(tr, this, ['27', '28', '29', '30', '31']), 'Total other payments and refundable credits'),

    '33': new ComputedLine((tr) => sumFormLines(tr, this, ['25d', '26', '32']), 'Total payments'),

    '34': new ComputedLine((tr) => clampToZero(this.getValue(tr, '33') - this.getValue(tr, '24')), 'Amount overpaid'),

    '37': new ComputedLine((tr) => clampToZero(this.getValue(tr, '24') - this.getValue(tr, '33')), 'Amount you owe'),
  }
}

export class QDCGTaxWorksheet extends QDCGTaxWorksheet_2019 {
  readonly name = 'QDCG Tax Worksheet';

  dividendsAndCapitalGains(tr: TaxReturn): number {
    return clampToZero(this.getValue(tr, '2') + this.getValue(tr, '3'));
  }

  taxableIncomeLessDividendsAndCapitalGains(tr: TaxReturn): number {
    return clampToZero(this.getValue(tr, '1') - this.getValue(tr, '4'));
  }

  totalTax(tr: TaxReturn): number {
    return Math.min(this.getValue(tr, '23'), this.getValue(tr, '24'));
  }

  readonly lines = {
    '1': new SymbolicLine(Form1040, 'taxableIncome', 'Taxable income'),
    '2': new ReferenceLine(Form1040, '3a', 'Qualified dividends'),
    '3': new ComputedLine((tr): number => {
      const schedD = tr.findForm(ScheduleD);
      if (schedD)
        return clampToZero(Math.min(schedD.getValue(tr, '15'), schedD.getValue(tr, '16')));
      return tr.getForm(Form1040).capitalGainOrLoss(tr);
    }),
    '4': new ComputedLine((tr) => this.dividendsAndCapitalGains(tr)),
    '5': new ComputedLine((tr) => this.taxableIncomeLessDividendsAndCapitalGains(tr)),
    '6': new ComputedLine((tr): number => {
      const fs = tr.getForm(Form1040).filingStatus;
      return tr.constants.capitalGains.rate0MaxIncome[fs];
    }),
    '7': new ComputedLine((tr): number => Math.min(this.getValue(tr, '1'), this.getValue(tr, '6'))),
    '8': new ComputedLine((tr): number => Math.min(this.getValue(tr, '5'), this.getValue(tr, '7'))),
    '9': new ComputedLine((tr): number => {
      return this.getValue(tr, '7') - this.getValue(tr, '8');
    }, 'Amount taxed at 0%'),
    '10': new ComputedLine((tr): number => Math.min(this.getValue(tr, '1'), this.getValue(tr, '4'))),
    '11': new ReferenceLine(QDCGTaxWorksheet as any, '9'),
    '12': new ComputedLine((tr): number => this.getValue(tr, '10') - this.getValue(tr, '11')),
    '13': new ComputedLine((tr): number => {
      const fs = tr.getForm(Form1040).filingStatus;
      return tr.constants.capitalGains.rate15MaxIncome[fs];
    }),
    '14': new ComputedLine((tr): number => Math.min(this.getValue(tr, '1'), this.getValue(tr, '13'))),
    '15': new ComputedLine((tr): number => this.getValue(tr, '5') + this.getValue(tr, '9')),
    '16': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '14') - this.getValue(tr, '15'))),
    '17': new ComputedLine((tr): number => Math.min(this.getValue(tr, '12'), this.getValue(tr, '16'))),
    '18': new ComputedLine((tr): number => {
      return this.getValue(tr, '17') * 0.15;
    }, 'Amount taxed at 15%'),
    '19': new ComputedLine((tr): number => this.getValue(tr, '9') + this.getValue(tr, '17')),
    '20': new ComputedLine((tr): number => this.getValue(tr, '10') - this.getValue(tr, '19')),
    '21': new ComputedLine((tr): number => {
      return this.getValue(tr, '20') * 0.20;
    }, 'Amount taxed at 20%'),
    '22': new ComputedLine((tr): number => {
      return computeTax(this.getValue(tr, '5'), tr);
    }, 'Tax on line 5'),
    '23': new ComputedLine((tr) => sumFormLines(tr, this, ['18', '21', '22'])),
    '24': new ComputedLine((tr): number => {
      return computeTax(this.getValue(tr, '1'), tr);
    }, 'Tax on line 1'),
    '25': new ComputedLine((tr) => this.totalTax(tr), 'Tax on all taxable income')
  };
}
