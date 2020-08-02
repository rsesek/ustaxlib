// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Form } from '../core';
import { ComputedLine, InputLine, ReferenceLine, UnsupportedLine, sumFormLines } from '../core/Line';
import { clampToZero } from '../core/Math';

import Form1040, { FilingStatus } from './Form1040';

export interface ScheduleAInput {
  medicalAndDentalExpenses?: number;

  stateAndLocalIncomeAndSalesTaxes?: number;
  stateAndLocalRealEstateTaxes?: number;
  stateAndLocalPropertyTaxes?: number;
  otherTaxes?: number;

  // This form does not apply the mortgage interest limitations.
  unreportedMortgageInterest?: number;
  unreportedMortagePoints?: number;
  mortgageInsurancePremiums?: number;
  investmentInterest?: number;

  charitableGiftsCashOrCheck?: number;
  charitableGiftsOther?: number;
  charitableCarryOver?: number;

  casualtyAndTheftLosses?: number;

  forceItemize?: boolean;
};

class Input extends InputLine<ScheduleAInput> {};

export default class ScheduleA extends Form<ScheduleAInput> {
  readonly name = 'Schedule A';

  readonly lines = {
    // Medical and dental expenses
    '1': new Input('medicalAndDentalExpenses', 'Medical and dental expenses', 0),
    '2': new ReferenceLine(Form1040, '8b'),
    '3': new ComputedLine((tr): number => this.getValue(tr, '2') * tr.constants.medicalDeductionLimitationPercent),
    '4': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '1') - this.getValue(tr, '3'))),

    // Taxes you paid
    '5a': new Input('stateAndLocalIncomeAndSalesTaxes', 'State and local income taxes or general sales taxes', 0),
    '5b': new Input('stateAndLocalRealEstateTaxes', 'State and local real estate taxes', 0),
    '5c': new Input('stateAndLocalPropertyTaxes', 'State and local personal property taxes', 0),
    '5d': new ComputedLine((tr): number => sumFormLines(tr, this, ['5a', '5b', '5c'])),
    '5e': new ComputedLine((tr): number => {
      const fs = tr.getForm(Form1040).filingStatus;
      const limit = tr.constants.saltLimit[fs];
      return Math.min(this.getValue(tr, '5d'), limit);
    }),
    '6': new Input('otherTaxes', 'Other taxes', 0),
    '7': new ComputedLine((tr): number => sumFormLines(tr, this, ['5e', '6'])),

    // Interest you paid
    // TODO - Form 1098
    '8a': new UnsupportedLine('Home mortgage interest and points'),
    '8b': new Input('unreportedMortgageInterest', 'Home mortgage interest not reported on Form 1098', 0),
    '8c': new Input('unreportedMortagePoints', 'Points not reported on Form 1098', 0),
    '8d': new Input('mortgageInsurancePremiums', 'Mortgage insurance premiums', 0),
    '8e': new ComputedLine((tr): number => sumFormLines(tr, this, ['8a', '8b', '8c', '8d'])),
    '9': new Input('investmentInterest', 'Investment interest', 0),
    '10': new ComputedLine((tr): number => sumFormLines(tr, this, ['8e', '9'])),

    // Gifts to charity
    '11': new Input('charitableGiftsCashOrCheck', 'Gifts by cash or check', 0),
    '12': new Input('charitableGiftsOther', 'Other than by cash or check', 0),
    '13': new Input('charitableCarryOver', 'Carryover from prior year', 0),
    '14': new ComputedLine((tr): number => sumFormLines(tr, this, ['11', '12', '13'])),

    '15': new Input('casualtyAndTheftLosses', 'Casualty and theft loss(es)', 0),

    '17': new ComputedLine((tr): number => sumFormLines(tr, this, ['4', '7', '10', '14', '15'])),
    '18': new Input('forceItemize', 'Itemize even if less than standard deduction', false),
  };
};
