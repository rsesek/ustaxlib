import Form, { FormClass } from '../Form';
import TaxReturn from '../TaxReturn';
import { Line, AccumulatorLine, ComputedLine, ReferenceLine, sumLineOfForms } from '../Line';
import { UnsupportedFeatureError } from '../Errors';

import Form8606 from './Form8606';
import Form8959 from './Form8959';
import Form1099INT from './Form1099INT';
import Form1099DIV from './Form1099DIV';
import Form1099R, { Box7Code } from './Form1099R';
import FormW2 from './FormW2';
import ScheduleD, { ScheduleDTaxWorksheet } from './ScheduleD';

export enum FilingStatus {
  Single = 'S',
  MarriedFilingSeparate = 'MFS',
  MarriedFilingJoint = 'MFJ',
};

export interface Form1040Input {
  filingStatus: FilingStatus;
};

const reduceBySum = (list: number[]) => list.reduce((acc, curr) => acc + curr, 0);

export default class Form1040 extends Form<Form1040['_lines'], Form1040Input> {
  readonly name = '1040';

  protected readonly _lines = {
    '1': new AccumulatorLine(FormW2, '1', 'Wages, salaries, tips, etc.'),
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
    '7a': new ReferenceLine(/*'Schedule 1'*/ undefined, '9', 'Other income from Schedule 1', 0),

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

    '8a': new ReferenceLine(undefined /*'Schedule 1'*/, '22', 'Adjustments to income', 0),

    '8b': new ComputedLine((tr): number => {
      return this.getValue(tr, '7b') - this.getValue(tr, '8a');
    }, 'Adjusted gross income'),

    // TODO - Deduction
    '9': new ComputedLine(() => 0, 'Deduction'),

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

    '13b': new ComputedLine((tr): number => {
      // TODO: add Sched 3.L7
      return 0;
    }, 'Additional credits'),

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
        new AccumulatorLine(FormW2, '2'),
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

    // 18 not supported

    '19': new ReferenceLine(Form1040 as any, '17', 'Total payments'),

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

export class Schedule2 extends Form<Schedule2['_lines']> {
  readonly name = 'Schedule 2';

  protected readonly _lines = {
    '1': new ComputedLine((tr): number => {
      // TODO - this is just using Taxable Income, rather than AMT-limited
      // income
      const f1040 = tr.getForm(Form1040);
      const taxableIncome = f1040.getValue(tr, '11b');
      switch (f1040.getInput('filingStatus')) {
        case FilingStatus.Single:
          if (taxableIncome < 510300)
            return 0;
        case FilingStatus.MarriedFilingJoint:
          if (taxableIncome < 1020600)
            return 0;
        case FilingStatus.MarriedFilingSeparate:
          if (taxableIncome < 510300)
            return 0;
      }
      throw new UnsupportedFeatureError('The AMT is not supported');
    }, 'AMT'),
    // 2 is not supported (Excess advance premium tax credit repayment)
    '3': new ComputedLine((tr): number => {
      // Should include line 2.
      return this.getValue(tr, '1');
    }),

    // 4 is not supported (Self-employment tax.)
    // 5 is not supported (Unreported social security and Medicare tax from)
    // 6 is not supported (Additional tax on IRAs, other qualified retirement plans, and other tax-favored accounts)
    // 7 is not supported (Household employment taxes.)
    '8': new ComputedLine((tr): number => {
      const f1040 = tr.getForm(Form1040);
      const wages = f1040.getLine('1').value(tr);

      let niit: boolean;
      const filingStatus = f1040.getInput('filingStatus');

      const additionalMedicare = wages > Form8959.filingStatusLimit(filingStatus);

      switch (f1040.getInput('filingStatus')) {
        case FilingStatus.Single:
          if (wages > 200000) {
            niit = true;
          }
          break;
        case FilingStatus.MarriedFilingJoint:
          if (wages > 250000) {
            niit = true;
          }
          break;
        case FilingStatus.MarriedFilingSeparate:
          if (wages > 125000) {
            niit = true;
          }
          break;
      }

      let value = 0;

      if (additionalMedicare) {
        const f8959 = tr.getForm(Form8959);
        value += f8959.getValue(tr, '18');
      }

      if (niit) {
        //const f8960 = tr.getForm('8960');
      }

      return value;
    }),
    // 9 is not supported (Section 965 net tax liability installment from Form 965-A)

    '10': new ComputedLine((tr): number => {
      // Should be lines 4 - 8.
      return this.getValue(tr, '8');
    })
  };
};

export function computeTax(income: number, filingStatus: FilingStatus): number {
  if (income < 100000)
    throw new UnsupportedFeatureError('Tax-table tax liability not supported');

  switch (filingStatus) {
    case FilingStatus.Single:
      if (income < 160725)
        return (income * 0.24) - 5825.50;
      else if (income < 204100)
        return (income * 0.32) - 18683.50;
      else if (income < 510300)
        return (income * 0.35) - 24806.50;
      else
        return (income * 0.38) - 35012.50;
    case FilingStatus.MarriedFilingJoint:
      if (income < 168400)
        return (income * 0.22) - 8283.00;
      else if (income < 321450)
        return (income * 0.24) - 11651.00;
      else if (income < 408200)
        return (income * 0.32) - 37367.00;
      else if (income < 612350)
        return (income * 0.35) - 49613.00;
      else
        return (income * 0.37) - 61860.00;
    case FilingStatus.MarriedFilingSeparate:
      if (income < 160725)
        return (income * 0.24) - 5825.50;
      else if (income < 204100)
        return (income * 0.32) - 18683.50;
      else if (income < 306175)
        return (income * 0.35) - 24806.50;
      else
        return (income * 0.37) - 30930.00;
  }
  throw new UnsupportedFeatureError('Unexpected return type');
};
