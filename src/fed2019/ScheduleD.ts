import Form from '../Form';
import Person from '../Person';
import TaxReturn from '../TaxReturn';
import { Line, AccumulatorLine, ComputedLine, sumLineOfForms } from '../Line';

import Form8949, { Form8949Box } from './Form8949';
import Form1099DIV from './Form1099DIV';
import Form1040, { FilingStatus } from './Form1040';

class ScheduleDTotal extends Line<number> {
  private _line: keyof Form8949['lines'];
  private _box: Form8949Box;

  constructor(description: string, line: keyof Form8949['lines'], box: Form8949Box) {
    super(description);
    this._line = line;
    this._box = box;
  }

  value(tr: TaxReturn): number {
    const forms: Form8949[] = tr.findForms(Form8949).filter(f => f.getValue(tr, 'Box') == this._box);
    return sumLineOfForms(tr, forms, this._line);
  }
};

export default class ScheduleD extends Form<ScheduleD['_lines']> {
  readonly name = 'Schedule D';

  protected readonly _lines = {
    // 1a not supported (Totals for all short-term transactions reported on Form 1099-B for which basis was reported to the IRS and for which you have no adjustments)

    '1b(d)': new ScheduleDTotal('Proceeds of short-term basis reported', '2(d)', Form8949Box.A),
    '1b(e)': new ScheduleDTotal('Cost basis of short-term basis-reported', '2(e)', Form8949Box.A),
    '1b(g)': new ScheduleDTotal('Adjustments to short-term basis-reported', '2(g)', Form8949Box.A),
    '1b(h)': new ComputedLine((tr: TaxReturn): number => {
      return (this.getValue(tr, '1b(d)') - this.getValue(tr, '1b(e)')) + this.getValue(tr, '1b(g)');
    }, 'Gain of short-term basis reported'),

    '2(d)': new ScheduleDTotal('Proceeds of short-term basis NOT reported', '2(d)', Form8949Box.B),
    '2(e)': new ScheduleDTotal('Cost basis of short-term NOT basis-reported', '2(e)', Form8949Box.B),
    '2(g)': new ScheduleDTotal('Adjustments to short-term NOT basis-reported', '2(g)', Form8949Box.B),
    '2(h)': new ComputedLine((tr: TaxReturn): number => {
      return (this.getValue(tr, '2(d)') - this.getValue(tr, '2(e)')) + this.getValue(tr, '2(g)');
    }, 'Gain of short-term basis NOT reported'),

    '3(d)': new ScheduleDTotal('Proceeds of short-term basis unreported', '2(d)', Form8949Box.C),
    '3(e)': new ScheduleDTotal('Cost basis of short-term unreported', '2(e)', Form8949Box.C),
    '3(g)': new ScheduleDTotal('Adjustments to short-term unreported', '2(g)', Form8949Box.C),
    '3(h)': new ComputedLine((tr: TaxReturn): number => {
      return (this.getValue(tr, '3(d)') - this.getValue(tr, '3(e)')) + this.getValue(tr, '3(g)');
    }, 'Gain of short-term unreported'),

    // 4 is not supported (Short-term gain from Form 6252 and short-term gain or (loss) from Forms 4684, 6781, and 8824)
    // 5 is not supported (Net short-term gain or (loss) from partnerships, S corporations, estates, and trusts from Schedule(s) K-1)
    // 6 is not supported (Short-term capital loss carryover. Enter the amount, if any, from line 8 of your Capital Loss Carryover Worksheet in the instructions)

    '7': new ComputedLine((tr: TaxReturn): number => {
      // 4-6 should be included.
      return this.getValue(tr, '1b(h)') + this.getValue(tr, '2(h)'), this.getValue(tr, '3(h)');
    }, 'Net short-term capital gain or (loss)'),

    // 8a is not supported.

    '8b(d)': new ScheduleDTotal('Proceeds of long-term basis reported', '2(d)', Form8949Box.D),
    '8b(e)': new ScheduleDTotal('Cost basis of long-term basis-reported', '2(e)', Form8949Box.D),
    '8b(g)': new ScheduleDTotal('Adjustments to long-term basis-reported', '2(g)', Form8949Box.D),
    '8b(h)': new ComputedLine((tr: TaxReturn): number => {
      return (this.getValue(tr, '8b(d)') - this.getValue(tr, '8b(e)')) + this.getValue(tr, '8b(g)');
    }, 'Gain of long-term basis reported'),

    '9(d)': new ScheduleDTotal('Proceeds of long-term basis NOT reported', '2(d)', Form8949Box.E),
    '9(e)': new ScheduleDTotal('Cost basis of long-term NOT basis-reported', '2(e)', Form8949Box.E),
    '9(g)': new ScheduleDTotal('Adjustments to long-term NOT basis-reported', '2(g)', Form8949Box.E),
    '9(h)': new ComputedLine((tr: TaxReturn): number => {
      return (this.getValue(tr, '9(d)') - this.getValue(tr, '9(e)')) + this.getValue(tr, '9(g)');
    }, 'Gain of long-term basis NOT reported'),

    '10(d)': new ScheduleDTotal('Proceeds of long-term basis unreported', '2(d)', Form8949Box.F),
    '10(e)': new ScheduleDTotal('Cost basis of long-term unreported', '2(e)', Form8949Box.F),
    '10(g)': new ScheduleDTotal('Adjustments to long-term unreported', '2(g)', Form8949Box.F),
    '10(h)': new ComputedLine((tr: TaxReturn): number => {
      return (this.getValue(tr, '10(d)') - this.getValue(tr, '10(e)')) + this.getValue(tr, '10(g)');
    }, 'Gain of long-term unreported'),

    // 11 is not supported (Gain from Form 4797, Part I; long-term gain from Forms 2439 and 6252; and long-term gain or (loss) from Forms 4684, 6781, and 8824)
    // 12 is not supported (Net long-term gain or (loss) from partnerships, S corporations, estates, and trusts from Schedule(s) K-1)

    '13': new AccumulatorLine(Form1099DIV, '2a', 'Capital gain distributions'),

    // 14 is not supported (Long-term capital loss carryover. Enter the amount, if any, from line 13 of your Capital Loss Carryover Worksheet in the instructions)

    '15': new ComputedLine((tr: TaxReturn): number => {
      // 11-14 should be included.
      return this.getValue(tr, '8b(h)') + this.getValue(tr, '9(h)') + this.getValue(tr, '10(h)') +
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
