// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Form, TaxReturn } from '../core';
import { ComputedLine, InputLine } from '../core/Line';
import { NotFoundError, UnsupportedFeatureError } from '../core/Errors';
import { undefinedToZero } from '../core/Math';

import Form1040 from './Form1040';

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
    }
    if (this._predicate)
      this._predicate(value);
    return value;
  }
};

export default class Schedule1 extends Form<Schedule1['_lines'], Schedule1Input> {
  readonly name = 'Schedule 1';

  readonly _lines = {
    // Part 1
    '1': new Input('stateAndLocalTaxableRefunds'),
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
