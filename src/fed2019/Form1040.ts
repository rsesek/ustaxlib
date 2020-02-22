import Form from '../Form';
import TaxReturn from '../TaxReturn';
import { Line, AccumulatorLine, ComputedLine, ReferenceLine } from '../Line';
import { UnsupportedFeatureError } from '../Errors';

export enum FilingStatus {
  Single,
  MarriedFilingSeparate,
  MarriedFilingJoint,
};

export interface Form1040Input {
  filingStatus: FilingStatus;
};

const reduceBySum = (list: number[]) => list.reduce((acc, curr) => acc + curr, 0);

export default class Form1040 extends Form<Form1040['_lines'], Form1040Input> {
  readonly name = '1040';

  protected readonly _lines = {
    '1': new AccumulatorLine('W-2', '1', 'Wages, salaries, tips, etc.'),
    '2a': new AccumulatorLine('1099-INT', '8', 'Tax-exempt interest'),
    '2b': new AccumulatorLine('1099-INT', '1', 'Taxable interest'),
    '3a': new AccumulatorLine('1099-DIV', '1b', 'Qualified dividends'),
    '3b': new AccumulatorLine('1099-DIV', '1a', 'Ordinary dividends'),
    // 4a and 4b are complex
    '4b': new ComputedLine(() => 0),
    '4d': new ComputedLine(() => 0),
    // 4c and 4d are not supported
    // 5a and 5b are not supported
    '6': new ReferenceLine<number>('Schedule D', '21', 'Capital gain/loss', 0),
    '7a': new ReferenceLine<number>('Schedule 1', '9', 'Other income from Schedule 1', 0),

    '7b': new ComputedLine<number>((tr: TaxReturn): number => {
      const lineIds = ['1', '2b', '3b', '4b', '4d', /*'5b',*/ '6', '7a'];
      const lines: number[] = lineIds.map(l => this.getValue(tr, l as keyof Form1040['_lines']));
      return reduceBySum(lines);
    }, 'Total income'),

    '8a': new ReferenceLine<number>('Schedule 1', '22', 'Adjustments to income', 0),

    '8b': new ComputedLine<number>((tr: TaxReturn): number => {
      return this.getValue(tr, '7b') - this.getValue(tr, '8a');
    }, 'Adjusted gross income'),

    // TODO - Deduction
    '9': new ComputedLine<number>(() => 0, 'Deduction'),

    '10': new ComputedLine<number>((tr: TaxReturn): number => {
      const taxableIncome = this.getValue(tr, '8b');
      let use8995a = false;
      switch (this.getInput('filingStatus')) {
        case FilingStatus.Single:                use8995a = taxableIncome <= 160700; break;
        case FilingStatus.MarriedFilingSeparate: use8995a = taxableIncome <= 160725; break;
        case FilingStatus.MarriedFilingJoint:    use8995a = taxableIncome <= 321400; break;
      };
      return 0;
    }, 'Qualified business income deduction'),

    '11a': new ComputedLine<number>((tr: TaxReturn): number => {
      return this.getValue(tr, '9') + this.getValue(tr, '10');
    }),
    '11b': new ComputedLine<number>((tr: TaxReturn): number => {
      const value = this.getValue(tr, '8b') - this.getValue(tr, '11a');
      return value < 0 ? 0 : value;
    }, 'Taxable income'),

    '12a': new ComputedLine<number>((tr: TaxReturn): number => {
      // Not supported:
      // Form 8814 (election to report child's interest or dividends)
      // Form 4972 (relating to lump-sum distributions)
      const taxableIncome = this.getValue(tr, '11b');
      if (taxableIncome < 100000)
        throw new UnsupportedFeatureError('Tax-table tax liability not supported');

      const l11b = this.getValue(tr, '11b');

      switch (this.getInput('filingStatus')) {
        case FilingStatus.Single:
          if (taxableIncome < 160725)
            return (l11b * 0.24) - 5825.50;
          else if (taxableIncome < 204100)
            return (l11b * 0.32) - 18683.50;
          else if (taxableIncome < 510300)
            return (l11b * 0.35) - 24806.50;
          else
            return (l11b * 0.38) - 35012.50;
        case FilingStatus.MarriedFilingJoint:
          if (taxableIncome < 168400)
            return (l11b * 0.22) - 8283.00;
          else if (taxableIncome < 321450)
            return (l11b * 0.24) - 11651.00;
          else if (taxableIncome < 408200)
            return (l11b * 0.32) - 37367.00;
          else if (taxableIncome < 612350)
            return (l11b * 0.35) - 49613.00;
          else
            return (l11b * 0.37) - 61860.00;
        case FilingStatus.MarriedFilingSeparate:
          if (taxableIncome < 160725)
            return (l11b * 0.24) - 5825.50;
          else if (taxableIncome < 204100)
            return (l11b * 0.32) - 18683.50;
          else if (taxableIncome < 306175)
            return (l11b * 0.35) - 24806.50;
          else
            return (l11b * 0.37) - 30930.00;
      }
      throw new UnsupportedFeatureError('Unexpected return type');
    }, 'Tax'),

    '12b': new ComputedLine<number>((tr: TaxReturn): number => {
      // TODO: add Sched 2.L3
      return this.getValue(tr, '12a');
    }),

    // Not supported: 13a - child tax credit

    '13b': new ComputedLine<number>((tr: TaxReturn): number => {
      // TODO: add Sched 3.L7
      return 0;
    }),

    '14': new ComputedLine<number>((tr: TaxReturn): number => {
      const l12b = this.getValue(tr, '12b');
      const l13b = this.getValue(tr, '13b');
      const value = l12b - l13b;
      return value < 0 ? 0 : value;
    }),

    '15': new ReferenceLine<number>('Schedule 2', '10', undefined, 0),

    '16': new ComputedLine<number>((tr: TaxReturn): number => {
      return this.getValue(tr, '14') + this.getValue(tr, '15');
    }, 'Total tax'),

    '17': new ComputedLine<number>((tr: TaxReturn): number => {
      const fedTaxWithheldBoxes = [
        ['W-2', '2'], ['1099-R', '4'], ['1099-DIV', '4'], ['1099-INT', '4']
      ];
      const withholding = fedTaxWithheldBoxes.map(b => (new AccumulatorLine(b[0], b[1])).value(tr));

      let additionalMedicare = 0;
      const f8959 = tr.maybeGetForm('8595')
      if (f8959) {
        additionalMedicare = f8959.getValue(tr, '24');
      }

      return reduceBySum(withholding) + additionalMedicare;
    }, 'Federal income tax withheld'),

    // 18 not supported

    '19': new ReferenceLine<number>('1040', '17', 'Total payments'),

    '20': new ComputedLine<number>((tr: TaxReturn): number => {
      const l16 = this.getValue(tr, '16');
      const l19 = this.getValue(tr, '19');
      if (l19 > l16)
        return l19 - l16;
      return 0;
    }, 'Amount overpaid'),

    '23': new ComputedLine<number>((tr: TaxReturn): number => {
      const l16 = this.getValue(tr, '16');
      const l19 = this.getValue(tr, '19');
      if (l19 < l16)
        return l16 - l19;
      return 0;
    }, 'Amount you owe'),
  };

};
