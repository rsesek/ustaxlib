// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Form, TaxReturn } from '../core';
import { ComputedLine, InputLine } from '../core/Line';
import * as Trace from '../core/Trace';
import { NotFoundError, UnsupportedFeatureError } from '../core/Errors';
import { undefinedToZero } from '../core/Math';

import Form1040, { FilingStatus } from './Form1040';

export interface Schedule1Input {
  // Additional Income
  stateAndLocalTaxableRefunds?: number;
  alimonyReceived?: number;
  businessIncome?: number;
  otherGainsOrLosses?: number
  rentalRealEstateRoyaltiesPartnershipsSCorps?: number;
  farmIncome?: number;
  unemploymentCompensation?: number;
  otherIncome?: number;

  // Adjustments
  educatorExpenses?: number;
  businessExpensesForm2106?: number;
  hsaDeduction?: number;
  armedForcesMovingExpenses?: number;
  deductibleSelfEmploymentTax?: number;
  selfEmployedSepSimpleQualifiedPlans?: number;
  selfEmployedHealthInsuranceDeduction?: number;
  penaltyOnEarlyWithdrawal?: number;
  alimonyPaid?: number;
  iraDeduction?: number;
  studentLoanInterestDeduction?: number;
  tuitionAndFees?: number;
};

class Input<T extends keyof Schedule1Input> extends InputLine<Schedule1Input, T> {
  private _predicate: (value: Schedule1Input[T]) => void;

  constructor(input: T, predicate?: (value: Schedule1Input[T]) => void) {
    super(input);
    this._predicate = predicate;
  }

  value(tr: TaxReturn): Schedule1Input[T] {
    let value: Schedule1Input[T] = undefined;
    try {
      value = super.value(tr);
    } catch (NotFoundError) {
      Trace.end();
    }
    if (this._predicate)
      this._predicate(value);
    return value;
  }
};

export default class Schedule1 extends Form<Schedule1Input> {
  readonly name = 'Schedule 1';

  readonly lines = {
    // Part 1
    '1': new ComputedLine((tr): number => {
      if (this.hasInput('stateAndLocalTaxableRefunds'))
        return tr.getForm(SALTWorksheet).getValue(tr, '9');
      return 0;
    }, 'Taxable refunds, credits, or offsets of state and local income taxes'),
    '2': new Input('alimonyReceived'),
    '3': new Input('businessIncome', (value: number) => {
      if (value !== undefined)
        throw new UnsupportedFeatureError('Schedule C not supported');
    }),
    '4': new Input('otherGainsOrLosses', (value: number) => {
      if (value !== undefined)
        throw new UnsupportedFeatureError('Form 4797 not supported');
    }),
    '5': new Input('rentalRealEstateRoyaltiesPartnershipsSCorps', (value: number) => {
      if (value !== undefined)
        throw new UnsupportedFeatureError('Schedule E not supported');
    }),
    '6': new Input('farmIncome', (value: number) => {
      if (value !== undefined)
        throw new UnsupportedFeatureError('Schedule F not supported');
    }),
    '7': new Input('unemploymentCompensation'),
    '8': new Input('otherIncome'),
    '9': new ComputedLine((tr): number => {
      return undefinedToZero(this.getValue(tr, '1')) +
             undefinedToZero(this.getValue(tr, '2')) +
             undefinedToZero(this.getValue(tr, '3')) +
             undefinedToZero(this.getValue(tr, '4')) +
             undefinedToZero(this.getValue(tr, '5')) +
             undefinedToZero(this.getValue(tr, '6')) +
             undefinedToZero(this.getValue(tr, '7')) +
             undefinedToZero(this.getValue(tr, '8'));
    }),

    // Part 2
    '10': new Input('educatorExpenses'),
    '11': new Input('businessExpensesForm2106', (value: number) => {
      if (value !== undefined)
        throw new UnsupportedFeatureError('Form 2106 not supported');
    }),
    '12': new Input('hsaDeduction', (value: number) => {
      if (value !== undefined)
        throw new UnsupportedFeatureError('Form 8889 not supported');
    }),
    '13': new Input('armedForcesMovingExpenses', (value: number) => {
      if (value !== undefined)
        throw new UnsupportedFeatureError('Form 3903 not supported');
    }),
    '14': new Input('deductibleSelfEmploymentTax', (value: number) => {
      if (value !== undefined)
        throw new UnsupportedFeatureError('Schedule SE not supported');
    }),
    '15': new Input('selfEmployedSepSimpleQualifiedPlans'),
    '16': new Input('selfEmployedHealthInsuranceDeduction'),
    '17': new Input('penaltyOnEarlyWithdrawal'),
    '18': new Input('alimonyPaid'),
    '19': new Input('iraDeduction'),
    '20': new Input('studentLoanInterestDeduction'),
    '21': new Input('tuitionAndFees', (value: number) => {
      if (value !== undefined)
        throw new UnsupportedFeatureError('Form 8917 not supported');
    }),
    '22': new ComputedLine((tr): number => {
      return undefinedToZero(this.getValue(tr, '10')) +
             undefinedToZero(this.getValue(tr, '11')) +
             undefinedToZero(this.getValue(tr, '12')) +
             undefinedToZero(this.getValue(tr, '13')) +
             undefinedToZero(this.getValue(tr, '14')) +
             undefinedToZero(this.getValue(tr, '15')) +
             undefinedToZero(this.getValue(tr, '16')) +
             undefinedToZero(this.getValue(tr, '17')) +
             undefinedToZero(this.getValue(tr, '18')) +
             undefinedToZero(this.getValue(tr, '19')) +
             undefinedToZero(this.getValue(tr, '20')) +
             undefinedToZero(this.getValue(tr, '21'));
    }),
  };
};

export interface SALTWorksheetInput {
  prevYearSalt: number;  // ScheduleA@5d.
  limitedPrevYearSalt: number;  // ScheduleA@5e.
  prevYearItemizedDeductions?: number;  // ScheduleA@17.
  prevYearFilingStatus?: FilingStatus;
};

export class SALTWorksheet extends Form<SALTWorksheetInput> {
  readonly name = 'SALT Refund Worksheet';

  readonly lines = {
    '1': new ComputedLine((tr): number => {
      const refunds = tr.findForm(Schedule1).getInput('stateAndLocalTaxableRefunds');
      const prevYear = this.getInput('prevYearSalt');
      return refunds > prevYear ? prevYear : refunds;
    }, 'Tax refunds'),
    '2': new ComputedLine((tr): [number, boolean] => {
      const prevYearSalt = this.getInput('prevYearSalt');
      const limitedPrevYearSalt = this.getInput('limitedPrevYearSalt');
      if (prevYearSalt > limitedPrevYearSalt) {
        return [prevYearSalt - limitedPrevYearSalt, true];
      }
      return [this.getValue(tr, '1'), false];
    }, 'Remainder of SALT limitation'),
    '3': new ComputedLine((tr): number => {
      const l1 = this.getValue(tr, '1');
      const l2 = this.getValue(tr, '2');
      if (!l2[1])
        return l1;
      if (l1 > l2[0])
        return l2[0] - l1;
      // Else: none of refund is taxable.
      return 0;
    }),
    '4': new InputLine<SALTWorksheetInput>('prevYearItemizedDeductions'),
    '5': new ComputedLine((tr): number => {
      switch (this.getInput('prevYearFilingStatus')) {
        case FilingStatus.Single:
        case FilingStatus.MarriedFilingSeparate:
          return 12000;
        case FilingStatus.MarriedFilingJoint:
          return 24000;
      }
    }, 'Previous year standard deduction'),
    '6': new ComputedLine((tr): number => 0, 'Special situations'),  // Not supported
    '7': new ComputedLine((tr): number => this.getValue(tr, '5') + this.getValue(tr, '6')),
    '8': new ComputedLine((tr): number => {
      const l4 = this.getValue(tr, '4');
      const l7 = this.getValue(tr, '7');
      if (l7 < l4)
        return l4 - l7;
      // Else: none of refund is taxable.
      return 0;
    }),
    '9': new ComputedLine((tr): number => Math.min(this.getValue(tr, '3'), this.getValue(tr, '8')), 'Taxable refund')
  };
};
