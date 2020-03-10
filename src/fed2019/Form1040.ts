import { Form, TaxReturn } from '../core';
import { Line, AccumulatorLine, ComputedLine, ReferenceLine, sumLineOfForms } from '../core/Line';
import { UnsupportedFeatureError } from '../core/Errors';
import { reduceBySum } from '../core/Math';

import Form8606 from './Form8606';
import Form8959 from './Form8959';
import Form1099INT from './Form1099INT';
import Form1099DIV from './Form1099DIV';
import Form1099R, { Box7Code } from './Form1099R';
import W2 from './W2';
import Schedule1 from './Schedule1';
import Schedule2 from './Schedule2';
import Schedule3 from './Schedule3';
import ScheduleD, { ScheduleDTaxWorksheet } from './ScheduleD';

export enum FilingStatus {
  Single = 'S',
  MarriedFilingSeparate = 'MFS',
  MarriedFilingJoint = 'MFJ',
};

export interface Form1040Input {
  filingStatus: FilingStatus;
};

export default class Form1040 extends Form<Form1040['_lines'], Form1040Input> {
  readonly name = '1040';

  protected readonly _lines = {
    '1': new AccumulatorLine(W2, '1', 'Wages, salaries, tips, etc.'),
    '2a': new AccumulatorLine(Form1099INT, '8', 'Tax-exempt interest'),
    '2b': new AccumulatorLine(Form1099INT, '1', 'Taxable interest'),
    '3a': new AccumulatorLine(Form1099DIV, '1b', 'Qualified dividends'),
    '3b': new AccumulatorLine(Form1099DIV, '1a', 'Ordinary dividends'),
    '4a': new ComputedLine((tr): number => {
      const f1099Rs = tr.findForms(Form1099R).filter(f => !f.getValue(tr, '7').includes(Box7Code.G));
      return sumLineOfForms(tr, f1099Rs, '1');
    }),
    '4b': new ComputedLine((tr): number => {
      const f8606s = tr.findForms(Form8606);
      return sumLineOfForms(tr, f8606s, '15c') + sumLineOfForms(tr, f8606s, '18');
    }, 'IRA distributions, taxadble amount'),
    '4d': new ComputedLine(() => 0),
    // 4c and 4d are not supported
    // 5a and 5b are not supported
    '6': new ComputedLine((tr): number => {
      const schedD = tr.findForm(ScheduleD);
      if (!schedD)
        return 0;

      const l6 = schedD.getValue(tr, '16');
      if (l6 > 0)
        return l6;
      return schedD.getValue(tr, '21');
    }, 'Capital gain/loss'),
    '7a': new ReferenceLine(Schedule1, '9', 'Other income from Schedule 1', 0),

    '7b': new ComputedLine((tr): number => {
      let income = 0;
      income += this.getValue(tr, '1');
      income += this.getValue(tr, '2b');
      income += this.getValue(tr, '3b');
      income += this.getValue(tr, '4b');
      income += this.getValue(tr, '4d');
      //income += this.getValue(tr, '5b');
      income += this.getValue(tr, '6');
      income += this.getValue(tr, '7a');
      return income;
    }, 'Total income'),

    '8a': new ReferenceLine(Schedule1, '22', 'Adjustments to income', 0),

    '8b': new ComputedLine((tr): number => {
      return this.getValue(tr, '7b') - this.getValue(tr, '8a');
    }, 'Adjusted gross income'),

    '9': new ComputedLine((): number => {
      // TODO - Itemized deductions.
      switch (this.getInput('filingStatus')) {
        case FilingStatus.Single:
        case FilingStatus.MarriedFilingSeparate:
          return 12200;
        case FilingStatus.MarriedFilingJoint:
          return 24400;
      }
    }, 'Deduction'),

    '10': new ComputedLine((tr): number => {
      const taxableIncome = this.getValue(tr, '8b');
      let use8995a = false;
      switch (this.getInput('filingStatus')) {
        case FilingStatus.Single:                use8995a = taxableIncome <= 160700; break;
        case FilingStatus.MarriedFilingSeparate: use8995a = taxableIncome <= 160725; break;
        case FilingStatus.MarriedFilingJoint:    use8995a = taxableIncome <= 321400; break;
      };
      return 0;
    }, 'Qualified business income deduction'),

    '11a': new ComputedLine((tr): number => {
      return this.getValue(tr, '9') + this.getValue(tr, '10');
    }),
    '11b': new ComputedLine((tr): number => {
      const value = this.getValue(tr, '8b') - this.getValue(tr, '11a');
      return value < 0 ? 0 : value;
    }, 'Taxable income'),

    '12a': new ComputedLine((tr): number => {
      // Not supported:
      // Form 8814 (election to report child's interest or dividends)
      // Form 4972 (relating to lump-sum distributions)
      const taxableIncome = this.getValue(tr, '11b');

      if (this.getValue(tr, '3a') > 0 && !tr.findForm(ScheduleD))
        throw new UnsupportedFeatureError('Qualified Dividends and Captial Gains Tax Worksheet not supported, Schedule D requried');

      const schedD = tr.findForm(ScheduleDTaxWorksheet);
      if (schedD)
        return schedD.getValue(tr, '47');

      return computeTax(taxableIncome, this.getInput('filingStatus'));
    }, 'Tax'),

    '12b': new ComputedLine((tr): number => {
      return this.getValue(tr, '12a') + tr.getForm(Schedule2).getValue(tr, '3');
    }, 'Additional tax'),

    // Not supported: 13a - child tax credit

    '13b': new ReferenceLine(Schedule3, '7', 'Additional credits', 0),

    '14': new ComputedLine((tr): number => {
      const l12b = this.getValue(tr, '12b');
      const l13b = this.getValue(tr, '13b');
      const value = l12b - l13b;
      return value < 0 ? 0 : value;
    }),

    '15': new ReferenceLine(Schedule2, '10', undefined, 0),

    '16': new ComputedLine((tr): number => {
      return this.getValue(tr, '14') + this.getValue(tr, '15');
    }, 'Total tax'),

    '17': new ComputedLine((tr): number => {
      const fedTaxWithheldBoxes = [
        new AccumulatorLine(W2, '2'),
        new AccumulatorLine(Form1099R, '4'),
        new AccumulatorLine(Form1099DIV, '4'),
        new AccumulatorLine(Form1099INT, '4'),
      ];
      const withholding: number[] = fedTaxWithheldBoxes.map(b => b.value(tr));

      let additionalMedicare = 0;
      const f8959 = tr.findForm(Form8959)
      if (f8959) {
        additionalMedicare = f8959.getValue(tr, '24');
      }

      return reduceBySum(withholding) + additionalMedicare;
    }, 'Federal income tax withheld'),

    // 18a not supported - Earned income credit (EIC)
    // 18b not supported - Additional child tax credit. Attach Schedule 8812
    // 18c not supported - American opportunity credit from Form 8863, line 8
    '18d': new ReferenceLine(Schedule3, '14', undefined, 0),
    '18e': new ComputedLine((tr): number => {
      // Should include 18a-18c.
      return this.getValue(tr, '18d');
    }),

    '19': new ComputedLine((tr): number => {
      return this.getValue(tr, '17') + this.getValue(tr, '18e');
    }, 'Total payments'),

    '20': new ComputedLine((tr): number => {
      const l16: number = this.getValue(tr, '16');
      const l19: number = this.getValue(tr, '19');
      if (l19 > l16)
        return l19 - l16;
      return 0;
    }, 'Amount overpaid'),

    '23': new ComputedLine((tr): number => {
      const l16 = this.getValue(tr, '16');
      const l19 = this.getValue(tr, '19');
      if (l19 < l16)
        return l16 - l19;
      return 0;
    }, 'Amount you owe'),
  };
};

export function computeTax(income: number, filingStatus: FilingStatus): number {
  // From https://www.irs.gov/pub/irs-drop/rp-18-57.pdf, Section 3.01 and
  // https://www.irs.gov/pub/irs-pdf/p17.pdf, 2019 Tax Rate Schedules (p254).
  const taxBrackets = {
    // Format is:
    // [ limit-of-taxable-income, marginal-rate, base-tax ]
    // If Income is over Row[0], pay Row[2] + (Row[1] * (Income - PreviousRow[0]))
    [FilingStatus.MarriedFilingJoint]: [
      [ 19400, 0.10, 0 ],
      [ 78950, 0.12, 1940 ],
      [ 168400, 0.22, 9086 ],
      [ 321450, 0.24, 28765 ],
      [ 408200, 0.32, 65497 ],
      [ 612350, 0.35, 93257 ],
      [ Infinity, 0.37, 164709.50 ]
    ],
    [FilingStatus.Single]: [
      [ 9700, 0.10, 0 ],
      [ 39475, 0.12, 970 ],
      [ 84200, 0.22, 4543 ],
      [ 160725, 0.24, 14382.50 ],
      [ 204100, 0.32, 32748.50 ],
      [ 510300, 0.35, 46628.50 ],
      [ Infinity, 0.37, 153798.50 ]
    ],
    [FilingStatus.MarriedFilingSeparate]: [
      [ 9700, 0.10, 0 ],
      [ 39475, 0.12, 970 ],
      [ 84200, 0.22, 4543 ],
      [ 160725, 0.24, 14382.50 ],
      [ 204100, 0.32, 32748.50 ],
      [ 306175, 0.35, 46628.50 ],
      [ Infinity, 0.37, 82354.75 ]
    ]
  }[filingStatus];

  let i = 0;
  while (taxBrackets[i][0] < income)
    ++i;

  const bracket = taxBrackets[i];
  const bracketStart = i == 0 ? 0 : taxBrackets[i - 1][0];

  return ((income - bracketStart) * bracket[1]) + bracket[2];
};
