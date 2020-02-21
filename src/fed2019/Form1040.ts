import Form from '../Form';
import TaxReturn from '../TaxReturn';
import { Line, AccumulatorLine, ComputedLine, ReferenceLine } from '../Line';

export enum FilingStatus {
  Single,
  MarriedFilingSingle,
  MarriedFilingJoint,
};

export interface Form1040Input {
  filingStatus: FilingStatus;
};

const reduceBySum = (list: number[]) => list.reduce((acc, curr) => acc + curr, 0);

export default class Form1040 extends Form<Form1040Input> {
  get name(): string { return '1040'; }

  protected getLines(): Line<any>[] {
    return [
      new AccumulatorLine('1', 'W-2', '1', 'Wages, salaries, tips, etc.'),
      new AccumulatorLine('2a', '1099-INT', '8', 'Tax-exempt interest'),
      new AccumulatorLine('2b', '1009-INT', '1', 'Taxable interest'),
      new AccumulatorLine('3a', '1099-DIV', '1b', 'Qualified dividends'),
      new AccumulatorLine('3b', '1099-DIV', '1a', 'Ordinary dividends'),
      // 4a and 4b are complex
      // 4c and 4d are not supported
      // 5a and 5b are not supported
      // 6 - Sched D
      new ReferenceLine<number>('7a', 'Schedule 1', '9', 'Other income from Schedule 1'),

      new ComputedLine<number>('7b', (tr: TaxReturn): number => {
        const lineIds = ['1', '2b', '3b', '4b', '4d', '5b', '6', '7a'];
        const lines = lineIds.map(l => this.getValue<number>(tr, l));
        return reduceBySum(lines);
      }, 'Total income'),

      new ReferenceLine<number>('8a', 'Schedule 1', '22', 'Adjustments to income'),

      new ComputedLine<number>('8b', (tr: TaxReturn): number => {
        return this.getValue<number>(tr, '7b') - this.getValue<number>(tr, '8a');
      }, 'Adjusted gross income'),

      // 9 - Deduction

      new ComputedLine<number>('10', (tr: TaxReturn): number => {
        const taxableIncome = this.getValue<number>(tr, '8b');
        let use8995a = false;
        switch (this.getInput('filingStatus')) {
          case FilingStatus.Single:              use8995a = taxableIncome <= 160700; break;
          case FilingStatus.MarriedFilingSingle: use8995a = taxableIncome <= 160725; break;
          case FilingStatus.MarriedFilingJoint:  use8995a = taxableIncome <= 321400; break;
        };
        return 0;
      }, 'Qualified business income deduction'),

      new ComputedLine<number>('11a', (tr: TaxReturn) => {
        return this.getValue<number>(tr, '9') + this.getValue<number>(tr, '10');
      }),
      new ComputedLine<number>('11b', (tr: TaxReturn) => {
        const value = this.getValue<number>(tr, '8b') - this.getValue<number>(tr, '11a');
        return value < 0 ? 0 : value;
      }, 'Taxable income'),

      new ComputedLine<number>('16', (tr: TaxReturn) => {
        return 0;
      }, 'Total tax'),

      new ComputedLine<number>('17', (tr: TaxReturn) => {
        const fedTaxWithheldBoxes = [
          ['W-2', '2'], ['1099-R', '4'], ['1099-DIV', '4'], ['1099-INT', '4']
        ];
        const withholding = fedTaxWithheldBoxes.map(b => (new AccumulatorLine('F1040.L17+', b[0], b[1])).value(tr));

        let additionalMedicare = 0;
        const f8959 = tr.maybeGetForm('8595')
        if (f8959) {
          additionalMedicare = f8959.getValue<number>(tr, '24');
        }

        return reduceBySum(withholding) + additionalMedicare;
      }, 'Federal income tax withheld'),

      // 18 not supported

      new ReferenceLine<number>('19', '1040', '17', 'Total payments'),

      new ComputedLine<number>('20', (tr: TaxReturn) => {
        const l16 = this.getValue<number>(tr, '16');
        const l19 = this.getValue<number>(tr, '19');
        if (l19 > l16)
          return l19 - l16;
        return 0;
      }, 'Amount overpaid'),

      new ComputedLine<number>('23', (tr: TaxReturn) => {
        const l16 = this.getValue<number>(tr, '16');
        const l19 = this.getValue<number>(tr, '19');
        if (l19 < l16)
          return l16 - l19;
        return 0;
      }, 'Amount you owe'),
    ];
  }
};
