import Form from '../Form';
import TaxReturn from '../TaxReturn';
import { Line, AccumulatorLine } from '../Line';

export interface Form1040Input {
};

export default class Form1040 extends Form<Form1040Input> {
  get name(): string { return 'Form 1040'; }

  protected getLines(): Line<any>[] {
    return [
      new AccumulatorLine('1', 'W-2', '1', 'Wages, salaries, tips, etc.'),
      new AccumulatorLine('2a', '1099-INT', '8', 'Tax-exempt interest'),
      new AccumulatorLine('2b', '1009-INT', '1', 'Taxable interest'),
    ];
  }
};
