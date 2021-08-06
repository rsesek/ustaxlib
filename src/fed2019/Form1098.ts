// Copyright 2021 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { TaxReturn, Form, Person } from '../core';
import { InputLine, ComputedLine, FormatType, sumFormLines, sumLineOfForms } from '../core/Line';

import Form1040, { FilingStatus } from './Form1040';

export interface Form1098Input {
  recipient: string;
  payee: Person;
  mortgageInterestReceived: number;
  // This is used for computing the "average mortgage balance." Consult Pub 936 and enter
  // a different value than the one on Form 1098 to use that instead for the average
  // balance calculations.
  outstandingMortgagePrincipal: number;
  mortgageOriginationDate: Date;
  refundOfOverpaidInterest?: number;
  mortgageInsurancePremiums?: number;
  pointsPaidOnPurchaseOfPrincipalResidence?: number;
};

class Input<T extends keyof Form1098Input> extends InputLine<Form1098Input, T> {};

export class Form1098 extends Form<Form1098Input> {
  readonly name = '1098';

  readonly supportsMultipleCopies = true;

  readonly includeJointPersonForms = true;

  person() { return this.getInput('payee'); }

  readonly lines = {
    'recipient': new Input('recipient'),
    'payee': new Input('payee'),
    '1': new Input('mortgageInterestReceived'),
    '2': new Input('outstandingMortgagePrincipal'),
    '3': new Input('mortgageOriginationDate'),
    '4': new Input('refundOfOverpaidInterest'),
    '5': new Input('mortgageInsurancePremiums'),
    '6': new Input('pointsPaidOnPurchaseOfPrincipalResidence'),
  };
};

const kGrandfatheredDate = new Date('1987-10-13');
const kLimitationStartDate = new Date('2017-12-15');

// Pub. 936 Worksheet
export class MortgageInterestDeductionWorksheet extends Form {
  readonly name = 'Mortgage Interest Deduction Worksheet';

  private get1098sMatchingPredicate(tr: TaxReturn, pred: (Form1098) => boolean): Form1098[] {
    return tr.findForms(Form1098).filter(pred);
  }

  deductibleMortgateInterest(tr: TaxReturn): number {
    const l11 = this.getValue(tr, '11');
    const l12 = this.getValue(tr, '12');
    if (l11 < l12) {
      return this.getValue(tr, '15');
    }
    return sumLineOfForms(tr, tr.findForms(Form1098), '1');
  }

  readonly lines = {
    '1': new ComputedLine((tr): number => {
      const f1098s = this.get1098sMatchingPredicate(tr, f => f.getValue(tr, '3') <= kGrandfatheredDate);
      if (f1098s.length == 0)
        return 0;
      return sumLineOfForms(tr, f1098s, '2') / f1098s.length;
    }, 'Average balance of grandfathered debt'),
    '2': new ComputedLine((tr): number => {
      const f1098s = this.get1098sMatchingPredicate(tr, f => {
        const date = f.getValue(tr, '3');
        return date >= kGrandfatheredDate && date <= kLimitationStartDate;
      });
      if (f1098s.length == 0)
        return 0;
      return sumLineOfForms(tr, f1098s, '2') / f1098s.length;
    }, 'Average balance of pre-limitation debt'),
    '3': new ComputedLine((tr): number => {
      if (tr.getForm(Form1040).filingStatus == FilingStatus.MarriedFilingSeparate)
        return 500_000;
      return 1_000_000;
    }),
    '4': new ComputedLine((tr): number => Math.max(this.getValue(tr, '1'), this.getValue(tr, '3'))),
    '5': new ComputedLine((tr): number => sumFormLines(tr, this, ['1', '2'])),
    '6': new ComputedLine((tr): number => Math.min(this.getValue(tr, '4'), this.getValue(tr, '5'))),
    '7': new ComputedLine((tr): number => {
      const f1098s = this.get1098sMatchingPredicate(tr, f => f.getValue(tr, '3') > kLimitationStartDate);
      if (f1098s.length == 0)
        return 0;
      return sumLineOfForms(tr, f1098s, '2') / f1098s.length;
    }, 'Average balance of post-limitation debt'),
    '8': new ComputedLine((tr): number => {
      const fs = tr.getForm(Form1040).filingStatus;
      return tr.constants.mortgatgeInterestDeduction.limit[fs];
    }),
    '9': new ComputedLine((tr): number => Math.max(this.getValue(tr, '6'), this.getValue(tr, '8'))),
    '10': new ComputedLine((tr): number => sumFormLines(tr, this, ['6', '7'])),
    '11': new ComputedLine((tr): number => Math.min(this.getValue(tr, '9'), this.getValue(tr, '10')), 'Qualified loan limit'),

    '12': new ComputedLine((tr): number => sumFormLines(tr, this, ['1', '2', '7']), 'Total of all average balanaces'),
    '13': new ComputedLine((tr): number => sumLineOfForms(tr, tr.findForms(Form1098), '1'), 'Total interest paid'),
    '14': new ComputedLine((tr): number => this.getValue(tr, '11') / this.getValue(tr, '12'), undefined, { formatType: FormatType.Decimal }),
    '15': new ComputedLine((tr): number => this.getValue(tr, '13') * this.getValue(tr, '14'), 'Deductible home mortgage interest'),
    '16': new ComputedLine((tr): number => this.getValue(tr, '13') - this.getValue(tr, '15'), 'Non-deductible interest'),
  };
};
