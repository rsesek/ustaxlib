import { Form, Person, TaxReturn } from '../core';
import { Line, AccumulatorLine, ComputedLine, ReferenceLine, sumLineOfForms } from '../core/Line';
import { clampToZero } from '../core/Math';
import { UnsupportedFeatureError } from '../core/Errors';

import Form8949, { Form8949Box } from './Form8949';
import Form1099DIV from './Form1099DIV';
import Form1040, { FilingStatus, computeTax } from './Form1040';

export default class ScheduleD extends Form<ScheduleD['_lines']> {
  readonly name = 'Schedule D';

  protected readonly _lines = {
    // 1a not supported (Totals for all short-term transactions reported on Form 1099-B for which basis was reported to the IRS and for which you have no adjustments)
    // 4 is not supported (Short-term gain from Form 6252 and short-term gain or (loss) from Forms 4684, 6781, and 8824)
    // 5 is not supported (Net short-term gain or (loss) from partnerships, S corporations, estates, and trusts from Schedule(s) K-1)
    // 6 is not supported (Short-term capital loss carryover. Enter the amount, if any, from line 8 of your Capital Loss Carryover Worksheet in the instructions)

    '7': new ComputedLine((tr): number => {
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

    '15': new ComputedLine((tr): number => {
      // 11-14 should be included.
      const f8949 = tr.getForm(Form8949);
      return f8949.getValue(tr, 'boxD').gainOrLoss +
             f8949.getValue(tr, 'boxE').gainOrLoss +
             f8949.getValue(tr, 'boxF').gainOrLoss +
             this.getValue(tr, '13');
    }, 'Net long-term capital gain or (loss)'),

    '16': new ComputedLine((tr): number => {
      return this.getValue(tr, '7') + this.getValue(tr, '15');
    }),

    '17': new ComputedLine((tr): boolean => {
      return this.getValue(tr, '15') > 0 && this.getValue(tr, '16') > 0;
    }, 'Both ST and LT are gains'),

    '18': new ComputedLine((tr): number | undefined => {
      if (!this.getValue(tr, '17') || this.getValue(tr, '16') <= 0)
        return undefined;
      // Not supported - only for gains on Qualified Small Business Stock or collectibles.
      return 0;
    }, '28% Rate Gain Worksheet Value'),

    // 19 is not supported (Unrecaptured Section 1250 Gain Worksheet)

    '20': new ComputedLine((tr): boolean | undefined => {
      if (!this.getValue(tr, '17') || this.getValue(tr, '16') <= 0)
        return undefined;
      const l18 = this.getValue(tr, '18');
      const l19 = undefined; //this.getValue(tr, '19');
      return (l18 === 0 || l18 === undefined) || (l19 === 0 || l19 === undefined);
    }, 'Line 18 and 19 both 0 or blank?'),

    '21': new ComputedLine((tr): number | undefined => {
      if (!this.getValue(tr, '17') || !this.getValue(tr, '20'))
        return undefined;
      const filingStatus = tr.getForm(Form1040).filingStatus;
      const limit = filingStatus == FilingStatus.MarriedFilingSeparate ? -1500 : -3000;
      return Math.min(this.getValue(tr, '16'), limit);
    }, 'Net capital loss'),
  };
};

export class ScheduleDTaxWorksheet extends Form<ScheduleDTaxWorksheet['_lines']> {
  readonly name = 'Schedule D Tax Worksheet';

  protected readonly _lines = {
    '1': new ReferenceLine(Form1040, '11b'),
    '2': new ReferenceLine(Form1040, '3a'),
    // TODO 3 - form 4952
    // TODO 4 - 4952
    '5': new ComputedLine((tr): number => 0),
    '6': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '2') - this.getValue(tr, '5'))),
    '7': new ComputedLine((tr): number => {
      const schedD = tr.getForm(ScheduleD);
      return Math.min(schedD.getValue(tr, '15'), schedD.getValue(tr, '16'));
    }),
    '8': new ComputedLine((tr): number => {
      return 0;
      // return Math.min(this.getValue(tr, '3'), this.getValue(tr, '4'));
    }),
    '9': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '7') - this.getValue(tr, '8'))),
    '10': new ComputedLine((tr): number => this.getValue(tr, '6') + this.getValue(tr, '9')),
    '11': new ComputedLine((tr): number => {
      const schedD = tr.getForm(ScheduleD);
      // TODO - line 19 is not supported.
      return Math.min(schedD.getValue(tr, '18'), Infinity); //schedD.getValue(tr, '19'));
    }),
    '12': new ComputedLine((tr): number => Math.min(this.getValue(tr, '9'), this.getValue(tr, '11'))),
    '13': new ComputedLine((tr): number => this.getValue(tr, '10') - this.getValue(tr, '12')),
    '14': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '1') - this.getValue(tr, '13'))),
    '15': new ComputedLine((tr): number => {
      switch (tr.getForm(Form1040).filingStatus) {
        case FilingStatus.Single:
        case FilingStatus.MarriedFilingSeparate:
          return 39375;
        case FilingStatus.MarriedFilingJoint:
          return 78750;
      }
    }),
    '16': new ComputedLine((tr): number => Math.min(this.getValue(tr, '1'), this.getValue(tr, '15'))),
    '17': new ComputedLine((tr): number => Math.min(this.getValue(tr, '14'), this.getValue(tr, '16'))),
    '18': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '1') - this.getValue(tr, '10'))),
    '19': new ComputedLine((tr): number => {
      let threshold: number;
      switch (tr.getForm(Form1040).filingStatus) {
        case FilingStatus.Single:
        case FilingStatus.MarriedFilingSeparate:
          threshold = 160725;
          break;
        case FilingStatus.MarriedFilingJoint:
          threshold = 321450;
          break;
      }
      return Math.min(this.getValue(tr, '1'), threshold);
    }),
    '20': new ComputedLine((tr): number => Math.min(this.getValue(tr, '14'), this.getValue(tr, '19'))),
    '21': new ComputedLine((tr): number => Math.max(this.getValue(tr, '18'), this.getValue(tr, '20'))),
    '22': new ComputedLine((tr): number => this.getValue(tr, '16') - this.getValue(tr, '17')),
    '23': new ComputedLine((tr): number => Math.min(this.getValue(tr, '1'), this.getValue(tr, '13'))),
    '24': new ReferenceLine(ScheduleDTaxWorksheet as any, '22'),
    '25': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '23') - this.getValue(tr, '24'))),
    '26': new ComputedLine((tr): number => {
      switch (tr.getForm(Form1040).filingStatus) {
        case FilingStatus.Single:
          return 434550;
        case FilingStatus.MarriedFilingSeparate:
          return 244425;
        case FilingStatus.MarriedFilingJoint:
          return 488850;
      }
    }),
    '27': new ComputedLine((tr): number => Math.min(this.getValue(tr, '1'), this.getValue(tr, '26'))),
    '28': new ComputedLine((tr): number => this.getValue(tr, '21') + this.getValue(tr, '22')),
    '29': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '27') - this.getValue(tr, '28'))),
    '30': new ComputedLine((tr): number => Math.min(this.getValue(tr, '25'), this.getValue(tr, '29'))),
    '31': new ComputedLine((tr): number => this.getValue(tr, '30') * 0.15),
    '32': new ComputedLine((tr): number => this.getValue(tr, '24') + this.getValue(tr, '30')),
    '33': new ComputedLine((tr): number => this.getValue(tr, '23') - this.getValue(tr, '32')),
    '34': new ComputedLine((tr): number => this.getValue(tr, '33') * 0.20),
    '35': new ComputedLine((tr): number => {
      const schedD = tr.getForm(ScheduleD);
      // TODO - line 19 is not supported.
      return Math.min(this.getValue(tr, '9'), Infinity); //schedD.getValue(tr, '19'));
    }),
    '36': new ComputedLine((tr): number => this.getValue(tr, '10') + this.getValue(tr, '21')),
    '37': new ReferenceLine(ScheduleDTaxWorksheet as any, '1'),
    '38': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '36') - this.getValue(tr, '37'))),
    '39': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '35') - this.getValue(tr, '38'))),
    '40': new ComputedLine((tr): number => this.getValue(tr, '39') * 0.25),
    '41': new ComputedLine((tr): number => {
      const schedD = tr.getForm(ScheduleD);
      if (schedD.getValue(tr, '18'))
        throw new UnsupportedFeatureError('28% Gain unsupported');
      return 0;
    }),
    '42': new ComputedLine((tr): number => {
      if (!tr.getForm(ScheduleD).getValue(tr, '18'))
        return 0;
      return this.getValue(tr, '1') - this.getValue(tr, '41');
    }),
    '43': new ComputedLine((tr): number => {
      if (!tr.getForm(ScheduleD).getValue(tr, '18'))
        return 0;
      return this.getValue(tr, '42') * 0.28;
    }),
    '44': new ComputedLine((tr): number => {
      const income = this.getValue(tr, '21');
      return computeTax(income, tr.getForm(Form1040).filingStatus);
    }),
    '45': new ComputedLine((tr): number => {
      return this.getValue(tr, '31') +
             this.getValue(tr, '34') +
             this.getValue(tr, '40') +
             this.getValue(tr, '43') +
             this.getValue(tr, '44');
    }),
    '46': new ComputedLine((tr): number => {
      const income = this.getValue(tr, '1');
      return computeTax(income, tr.getForm(Form1040).filingStatus);
    }),
    '47': new ComputedLine((tr): number => Math.min(this.getValue(tr, '45'), this.getValue(tr, '46'))),
  };
};
