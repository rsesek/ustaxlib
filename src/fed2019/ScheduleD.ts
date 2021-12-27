// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Form, Person, TaxReturn } from '../core';
import { Line, AccumulatorLine, ComputedLine, InputLine, ReferenceLine, SymbolicLine, UnsupportedLine, sumFormLines, sumLineOfForms } from '../core/Line';
import { Literal, clampToZero } from '../core/Math';
import { NotFoundError, UnsupportedFeatureError } from '../core/Errors';

import Form8949, { Form8949Box } from './Form8949';
import Form1099DIV from './Form1099DIV';
import Form1040, { FilingStatus, computeTax } from './Form1040';

export default class ScheduleD extends Form {
  readonly name = 'Schedule D';

  readonly lines = {
    // 1a not supported (Totals for all short-term transactions reported on Form 1099-B for which basis was reported to the IRS and for which you have no adjustments)
    '4': new UnsupportedLine(),  // Short-term gain from Form 6252 and short-term gain or (loss) from Forms 4684, 6781, and 8824
    '5': new UnsupportedLine(),  // Net short-term gain or (loss) from partnerships, S corporations, estates, and trusts from Schedule(s) K-1
    '6': new ComputedLine((tr): number => {
      const ws = tr.findForm(CapitalLossCarryoverWorksheet);
      if (!ws)
        return 0;
      return -ws.getValue(tr, '6');
    }, 'Short-term capital loss carryover'),

    '7': new ComputedLine((tr): number => {
      // 1-3 are computed by Form8949.
      let value = sumFormLines(tr, this, ['4', '5', '6']);
      const f8949 = tr.getForm(Form8949);
      value += f8949.getValue(tr, 'boxA').gainOrLoss;
      value += f8949.getValue(tr, 'boxB').gainOrLoss;
      value += f8949.getValue(tr, 'boxC').gainOrLoss;
      return value;
    }, 'Net short-term capital gain or loss'),

    // 8a is not supported.

    '11': new UnsupportedLine(),  // Gain from Form 4797, Part I; long-term gain from Forms 2439 and 6252; and long-term gain or (loss) from Forms 4684, 6781, and 8824
    '12': new UnsupportedLine(),  // Net long-term gain or (loss) from partnerships, S corporations, estates, and trusts from Schedule(s) K-1
    '13': new AccumulatorLine(Form1099DIV, '2a', 'Capital gain distributions'),
    '14': new ComputedLine((tr): number => {
      const ws = tr.findForm(CapitalLossCarryoverWorksheet);
      if (!ws)
        return 0;
      return -ws.getValue(tr, '13');
    }, 'Long-term capital loss carryover'),

    '15': new ComputedLine((tr): number => {
      let value = sumFormLines(tr, this, ['11', '12', '13', '14']);
      const f8949 = tr.getForm(Form8949);
      value += f8949.getValue(tr, 'boxD').gainOrLoss;
      value += f8949.getValue(tr, 'boxE').gainOrLoss;
      value += f8949.getValue(tr, 'boxF').gainOrLoss;
      return value;
    }, 'Net long-term capital gain or loss'),

    '16': new ComputedLine((tr): number => {
      return this.getValue(tr, '7') + this.getValue(tr, '15');
      // If value is a gain, enter on 1040/6 and goto 17.
      // If value is a loss, goto 21 and 22.
      // If value is zero, enter 0 on 1040/6 and goto 22.
    }, 'Total capital gain or loss'),

    '17': new ComputedLine((tr): boolean => {
      return this.getValue(tr, '15') > 0 && this.getValue(tr, '16') > 0;
      // If yes, goto 18.
      // If no, goto 22.
    }, 'Both ST and LT are gains'),

    '18': new UnsupportedLine('28% Rate Gain Worksheet Value (Qualified Small Business Stock or collectibles.)'),

    '19': new UnsupportedLine('Unrecaptured Section 1250 Gain Worksheet'),

    '20': new ComputedLine((tr): boolean | undefined => {
      const l18 = this.getValue(tr, '18');
      const l19 = this.getValue(tr, '19');
      return (l18 === 0 || l18 === undefined) || (l19 === 0 || l19 === undefined);
    }, 'Line 18 and 19 both 0 or blank?'),

    '21': new ComputedLine((tr): number | undefined => {
      const l16 = this.getValue(tr, '16');
      if (l16 >= 0)
        return 0;
      const filingStatus = tr.getForm(Form1040).filingStatus;
      return Math.max(l16, tr.constants.capitalLossLimit[filingStatus]);
    }, 'Net capital loss'),

    '22': new ComputedLine((tr): boolean => {
      return tr.getForm(Form1040).qualifiedDividends(tr) > 0;
    }, 'Need QD/CG Tax Worksheet'),
  };
};

export class ScheduleDTaxWorksheet extends Form {
  readonly name = 'Schedule D Tax Worksheet';

  readonly lines = {
    '1': new SymbolicLine(Form1040, 'taxableIncome', 'Taxable income'),
    '2': new SymbolicLine(Form1040, 'qualifiedDividends', 'Qualified dividends'),
    '3': new UnsupportedLine('Form 4952@4g'),
    '4': new UnsupportedLine('Form 4952@4e'),
    '5': new ComputedLine((tr): number => 0),
    '6': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '2') - this.getValue(tr, '5'))),
    '7': new ComputedLine((tr): number => {
      const schedD = tr.getForm(ScheduleD);
      return Math.min(schedD.getValue(tr, '15'), schedD.getValue(tr, '16'));
    }, 'Capital loss'),
    '8': new ComputedLine((tr): number => {
      return Math.min(this.getValue(tr, '3'), this.getValue(tr, '4'));
    }),
    '9': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '7') - this.getValue(tr, '8'))),
    '10': new ComputedLine((tr): number => this.getValue(tr, '6') + this.getValue(tr, '9')),
    '11': new ComputedLine((tr): number => {
      const schedD = tr.getForm(ScheduleD);
      return schedD.getValue(tr, '18') + schedD.getValue(tr, '19');
    }, '28% gains and unrecaptured gains'),
    '12': new ComputedLine((tr): number => Math.min(this.getValue(tr, '9'), this.getValue(tr, '11'))),
    '13': new ComputedLine((tr): number => this.getValue(tr, '10') - this.getValue(tr, '12')),
    '14': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '1') - this.getValue(tr, '13'))),
    '15': new ComputedLine((tr): number => {
      const fs = tr.getForm(Form1040).filingStatus;
      return tr.constants.capitalGains.rate0MaxIncome[fs];
    }),
    '16': new ComputedLine((tr): number => Math.min(this.getValue(tr, '1'), this.getValue(tr, '15'))),
    '17': new ComputedLine((tr): number => Math.min(this.getValue(tr, '14'), this.getValue(tr, '16'))),
    '18': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '1') - this.getValue(tr, '10'))),
    '19': new ComputedLine((tr): number => {
      const fs = tr.getForm(Form1040).filingStatus;
      const threshold = tr.constants.qualifiedBusinessIncomeDeductionThreshold[fs];
      return Math.min(this.getValue(tr, '1'), threshold);
    }),
    '20': new ComputedLine((tr): number => Math.min(this.getValue(tr, '14'), this.getValue(tr, '19'))),
    '21': new ComputedLine((tr): number => Math.max(this.getValue(tr, '18'), this.getValue(tr, '20'))),
    '22': new ComputedLine((tr): number => this.getValue(tr, '16') - this.getValue(tr, '17'), 'Amount taxed at 0%'),
    '23': new ComputedLine((tr): number => Math.min(this.getValue(tr, '1'), this.getValue(tr, '13'))),
    '24': new ReferenceLine(ScheduleDTaxWorksheet as any, '22'),
    '25': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '23') - this.getValue(tr, '24'))),
    '26': new ComputedLine((tr): number => {
      const fs = tr.getForm(Form1040).filingStatus;
      return tr.constants.capitalGains.rate15MaxIncome[fs];
    }),
    '27': new ComputedLine((tr): number => Math.min(this.getValue(tr, '1'), this.getValue(tr, '26'))),
    '28': new ComputedLine((tr): number => this.getValue(tr, '21') + this.getValue(tr, '22')),
    '29': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '27') - this.getValue(tr, '28'))),
    '30': new ComputedLine((tr): number => Math.min(this.getValue(tr, '25'), this.getValue(tr, '29')), 'Amount taxed at 15%'),
    '31': new ComputedLine((tr): number => this.getValue(tr, '30') * Literal(0.15), '15% Tax'),
    '32': new ComputedLine((tr): number => this.getValue(tr, '24') + this.getValue(tr, '30')),
    '33': new ComputedLine((tr): number => this.getValue(tr, '23') - this.getValue(tr, '32'), 'Amount taxed at 20%'),
    '34': new ComputedLine((tr): number => this.getValue(tr, '33') * Literal(0.20), '20% Tax'),
    '35': new ComputedLine((tr): number => {
      const schedD = tr.getForm(ScheduleD);
      return Math.min(this.getValue(tr, '9'), schedD.getValue(tr, '19'));
    }),
    '36': new ComputedLine((tr): number => this.getValue(tr, '10') + this.getValue(tr, '21')),
    '37': new ReferenceLine(ScheduleDTaxWorksheet as any, '1'),
    '38': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '36') - this.getValue(tr, '37'))),
    '39': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '35') - this.getValue(tr, '38'))),
    '40': new ComputedLine((tr): number => this.getValue(tr, '39') * Literal(0.25), 'Tax on unrecaptured gains'),
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
      return this.getValue(tr, '42') * Literal(0.28);
    }, '28% gain tax'),
    '44': new ComputedLine((tr): number => {
      const income = this.getValue(tr, '21');
      return computeTax(income, tr);
    }, 'Nominal rate tax'),
    '45': new ComputedLine((tr): number => {
      return sumFormLines(tr, this, ['31', '34', '40', '43', '44']);
    }, 'Schedule D tax'),
    '46': new ComputedLine((tr): number => {
      const income = this.getValue(tr, '1');
      return computeTax(income, tr);
    }, 'Income tax'),
    '47': new ComputedLine((tr): number => Math.min(this.getValue(tr, '45'), this.getValue(tr, '46')), 'Tax on all taxable income'),
  };
};

export interface CapitalLossCarryoverWorksheetInput {
  priorYearTaxableIncome: number;
  priorYearSchedDGainOrLoss: number;  // This is the value reported on F1040.
  priorYearNetShortTermGainOrLoss: number;
  priorYearNetLongTermGainOrLoss: number;
};

export class CapitalLossCarryoverWorksheet extends Form<CapitalLossCarryoverWorksheetInput> {
  readonly name = 'Capital Loss Carryover Worksheet';

  readonly lines = {
    '1': new InputLine<CapitalLossCarryoverWorksheetInput>('priorYearTaxableIncome'),
    '2': new ComputedLine((tr): number => Math.abs(this.getInput('priorYearSchedDGainOrLoss')), 'Prior year net loss as a positive amount'),
    '3': new ComputedLine((tr): number => clampToZero(sumFormLines(tr, this, ['1', '2']))),
    '4': new ComputedLine((tr): number => Math.min(this.getValue(tr, '2'), this.getValue(tr, '3'))),
    '5': new ComputedLine((tr): number => {
      const stgl = this.getInput('priorYearNetShortTermGainOrLoss');
      if (stgl > 0)
        return 0;
      return Math.abs(stgl);
    }, 'Prior year short-term capital loss as a positive amount'),
    '6': new ComputedLine((tr): number => clampToZero(this.getInput('priorYearNetLongTermGainOrLoss'))),
    '7': new ComputedLine((tr): number => sumFormLines(tr, this, ['4', '6'])),
    '8': new ComputedLine((tr): number => {
      const l5 = this.getValue(tr, '5');
      if (l5 <= 0)
        return 0;
      return clampToZero(l5 - this.getValue(tr, '7'))
    }, 'Short-term capital loss carryover'),
    '9': new ComputedLine((tr): number => {
      const ltgl = this.getInput('priorYearNetLongTermGainOrLoss');
      if (ltgl > 0)
        return 0;
      return Math.abs(ltgl);
    }, 'Prior year long-term capital loss as a positive amount'),
    '10': new ComputedLine((tr): number => clampToZero(this.getInput('priorYearNetShortTermGainOrLoss'))),
    '11': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '4') - this.getValue(tr, '5'))),
    '12': new ComputedLine((tr): number => sumFormLines(tr, this, ['10', '11'])),
    '13': new ComputedLine((tr): number => {
      const l9 = this.getValue(tr, '9');
      if (l9 <= 0)
        return 0;
      return clampToZero(l9 - this.getValue(tr, '12'));
    }, 'Long-term capital loss carryover'),
  };
};
