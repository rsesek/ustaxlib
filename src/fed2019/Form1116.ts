import Form from '../Form';
import TaxReturn from '../TaxReturn';
import Person from '../Person';
import { ComputedLine, InputLine, ReferenceLine } from '../Line';
import { UnsupportedFeatureError } from '../Errors';
import { reduceBySum } from '../Math';

import Form1040 from './Form1040';
import Form8949 from './Form8949';
import Schedule2 from './Schedule2';
import ScheduleD from './ScheduleD';

export enum ForeignIncomeCategory {
  A = 'A: Section 951A category',
  B = 'B: Foreign branch category',
  C = 'C: Passive category',
  D = 'D: General category',
  E = 'E: Section 901(j)',
  F = 'F: Certain income re-sourced by treaty',
  G = 'G: Lump-sum distributions',
};

export interface Form1116Input {
  person: Person;
  incomeCategory: ForeignIncomeCategory;
  posessionName: 'RIC' | string;
  grossForeignIncome: number;
  lossesFromForeignSources?: number;
  totalForeignTaxesPaidOrAccrued: number;
};

class Input<T extends keyof Form1116Input> extends InputLine<Form1116Input, T> {};

export default class Form1116 extends Form<Form1116['_lines'], Form1116Input> {
  readonly name = '1116';

  protected readonly _lines = {
    'category': new ComputedLine((tr: TaxReturn): ForeignIncomeCategory => {
      const input = this.getInput('incomeCategory');
      if (input != ForeignIncomeCategory.C)
        throw new UnsupportedFeatureError(`Form 1116 does not support ${input}`);
      return input;
    }),
    'i': new Input('posessionName'),
    '1a': new Input('grossForeignIncome'),
    // 1b not supported - services as an employee.
    // 2 not supported - Expenses definitely related to the income
    '3a': new ReferenceLine(Form1040, '9', 'Deductions'),
    '3b': new ComputedLine(() => 0, 'Other deductions'),  // Not supported
    '3c': new ComputedLine((tr): number => {
      return this.getValue(tr, '3a') + this.getValue(tr, '3b');
    }),
    '3d': new ReferenceLine(Form1116 as any, '1a'),  // Should exclude income from unsupported Form 2555.
    '3e': new ComputedLine((tr): number => {
      const f1040 = tr.findForm(Form1040);
      // Take total income, but do not net capital gains out with losses, so remove
      // line 6.
      let grossIncome = f1040.getValue(tr, '7b') - f1040.getValue(tr, '6');
      const f8949 = tr.findForm(Form8949);
      if (f8949) {
        const keys: (keyof Form8949['lines'])[] = ['boxA', 'boxB', 'boxC', 'boxD', 'boxE', 'boxF'];
        const values = keys.map(k => f8949.getValue(tr, k).gainOrLoss).filter(n => n > 0);
        grossIncome += reduceBySum(values);

        grossIncome += tr.getForm(ScheduleD).getValue(tr, '13');
      }
      return grossIncome;
    }),
    '3f': new ComputedLine((tr): number => {
      return Number.parseFloat((this.getValue(tr, '3d') / this.getValue(tr, '3e')).toFixed(4));
    }),
    '3g': new ComputedLine((tr): number => {
      return this.getValue(tr, '3c') * this.getValue(tr, '3f');
    }),
    // 4 not supported - Pro rata share of interest expense
    '5': new Input('lossesFromForeignSources', undefined, 0),
    '6': new ComputedLine((tr): number => {
      // Should include 2, 4a, 4b.
      return this.getValue(tr, '3g') + this.getValue(tr, '5');
    }),
    '7': new ComputedLine((tr): number => this.getValue(tr, '1a') - this.getValue(tr, '6')),
    // Skip the complicated Part II matrix and just use the input value.
    '8': new Input('totalForeignTaxesPaidOrAccrued'), 
    '9': new ReferenceLine(Form1116 as any, '8'),
    // 10 not supported - Carryback or carryover
    '11': new ComputedLine((tr): number => this.getValue(tr, '9') /* + this.getValue(tr, '10') */),
    // 12 not supported - Reduction in foreign taxes
    // 13 not supported - Taxes reclassified under high tax kickout
    '14': new ComputedLine((tr): number => {
      return this.getValue(tr, '11') /*+
             this.getValue(tr, '12') +
             this.getValue(tr, '13')*/;
    }),
    '15': new ReferenceLine(Form1116 as any, '7'),
    // 16 not supported - Adjustments to line 15
    '17': new ComputedLine((tr): number => this.getValue(tr, '15') /* + this.getValue(tr, '16') */),
    // TODO - This does not handle necessary adjustments.
    '18': new ReferenceLine(Form1040, '11b'),
    '19': new ComputedLine((tr): number => this.getValue(tr, '17') / this.getValue(tr, '18')),
    '20': new ComputedLine((tr): number => {
      let value = tr.getForm(Form1040).getValue(tr, '12a');
      const sched2 = tr.findForm(Schedule2);
      if (sched2)
        value += sched2.getValue(tr, '2');
      return value;
    }),
    '21': new ComputedLine((tr): number => this.getValue(tr, '20') * this.getValue(tr, '19'), 'Maximum amount of credit'),
    '22': new ComputedLine((tr): number => Math.min(this.getValue(tr, '14'), this.getValue(tr, '21'))),
    // 23-30 not supported (other category F1116)
    '31': new ReferenceLine(Form1116 as any, '22'),
    // 32 not supported - Reduction of credit for international boycott operations
    '33': new ComputedLine((tr): number => this.getValue(tr, '31') /* - this.getValue(tr, '32')*/),
  };
};
