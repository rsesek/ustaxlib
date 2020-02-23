import Form from '../Form';
import Person from '../Person';
import TaxReturn from '../TaxReturn';
import { Line, AccumulatorLine, ComputedLine, sumLineOfForms } from '../Line';

import Form8949, { Form8949Box } from './Form8949';
import Form1099DIV from './Form1099DIV';
import Form1040, { FilingStatus } from './Form1040';

export default class ScheduleD extends Form<ScheduleD['_lines']> {
  readonly name = 'Schedule D';

  protected readonly _lines = {
    // 1a not supported (Totals for all short-term transactions reported on Form 1099-B for which basis was reported to the IRS and for which you have no adjustments)
    // 4 is not supported (Short-term gain from Form 6252 and short-term gain or (loss) from Forms 4684, 6781, and 8824)
    // 5 is not supported (Net short-term gain or (loss) from partnerships, S corporations, estates, and trusts from Schedule(s) K-1)
    // 6 is not supported (Short-term capital loss carryover. Enter the amount, if any, from line 8 of your Capital Loss Carryover Worksheet in the instructions)

    '7': new ComputedLine((tr: TaxReturn): number => {
      // 1-3 are computed by Form8949.
      // 4-6 should be included.
      const f8949 = tr.getForm(Form8949);
      return f8949.getValue(tr, 'boxA').gainOrLoss +
             f8949.getValue(tr, 'boxB').gainOrLoss +
             f8949.getValue(tr, 'boxC').gainOrLoss;
    }, 'Net short-term capital gain or (loss)'),

    // 8a is not supported.

    // 11 is not supported (Gain from Form 4797, Part I; long-term gain from Forms 2439 and 6252; and long-term gain or (loss) from Forms 4684, 6781, and 8824)
    // 12 is not supported (Net long-term gain or (loss) from partnerships, S corporations, estates, and trusts from Schedule(s) K-1)

    '13': new AccumulatorLine(Form1099DIV, '2a', 'Capital gain distributions'),

    // 14 is not supported (Long-term capital loss carryover. Enter the amount, if any, from line 13 of your Capital Loss Carryover Worksheet in the instructions)

    '15': new ComputedLine((tr: TaxReturn): number => {
      // 11-14 should be included.
      const f8949 = tr.getForm(Form8949);
      return f8949.getValue(tr, 'boxD').gainOrLoss +
             f8949.getValue(tr, 'boxE').gainOrLoss +
             f8949.getValue(tr, 'boxF').gainOrLoss +
             this.getValue(tr, '13');
    }, 'Net long-term capital gain or (loss)'),

    '16': new ComputedLine((tr: TaxReturn): number => {
      return this.getValue(tr, '7') + this.getValue(tr, '15');
    }),

    '17': new ComputedLine((tr: TaxReturn): boolean => {
      return this.getValue(tr, '15') > 0 && this.getValue(tr, '16') > 0;
    }, 'Both ST and LT are gains'),

    '18': new ComputedLine((tr: TaxReturn): number | undefined => {
      if (!this.getValue(tr, '17'))
        return undefined;
      // TODO
      return 0;
    }, '28% Rate Gain Worksheet Value'),

    // 19 is not supported (Unrecaptured Section 1250 Gain Worksheet)

    '20': new ComputedLine((tr: TaxReturn): boolean | undefined => {
      if (!this.getValue(tr, '17'))
        return undefined;
      const l18 = this.getValue(tr, '18');
      const l19 = undefined; //this.getValue(tr, '19');
      return (l18 === 0 || l18 === undefined) || (l19 === 0 || l19 === undefined);
    }, 'Line 18 and 19 both 0 or blank?'),

    '21': new ComputedLine((tr: TaxReturn): number | undefined => {
      if (!this.getValue(tr, '17'))
        return undefined;
      const filingStatus = tr.getForm(Form1040).getInput('filingStatus');
      const limit = filingStatus == FilingStatus.MarriedFilingSeparate ? -1500 : -3000;
      return Math.min(this.getValue(tr, '16'), limit);
    }, 'Net capital loss'),
  };
};
