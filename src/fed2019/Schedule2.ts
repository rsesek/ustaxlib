// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Form, TaxReturn } from '../core';
import { ComputedLine, UnsupportedLine, sumFormLines } from '../core/Line';
import { UnsupportedFeatureError } from '../core/Errors';

import Form1040, { FilingStatus } from './Form1040';
import Form1099DIV from './Form1099DIV';
import Form1099INT from './Form1099INT';
import Form8959 from './Form8959';
import Form8960 from './Form8960';

export default class Schedule2 extends Form<Schedule2['lines']> {
  readonly name = 'Schedule 2';

  readonly lines = {
    '1': new ComputedLine((tr): number => {
      // TODO - this is just using Taxable Income, rather than AMT-limited
      // income
      const f1040 = tr.getForm(Form1040);
      const taxableIncome = f1040.getValue(tr, '11b');
      switch (f1040.filingStatus) {
        case FilingStatus.Single:
          if (taxableIncome < 510300)
            return 0;
        case FilingStatus.MarriedFilingJoint:
          if (taxableIncome < 1020600)
            return 0;
        case FilingStatus.MarriedFilingSeparate:
          if (taxableIncome < 510300)
            return 0;
      }
      throw new UnsupportedFeatureError('The AMT is not supported');
    }, 'AMT'),
    '2': new UnsupportedLine('Excess advance premium tax credit repayment'),
    '3': new ComputedLine((tr): number => {
      return this.getValue(tr, '1') + this.getValue(tr, '2');
    }),

    '4': new UnsupportedLine('Self-employment tax.'),
    '5': new UnsupportedLine('Unreported social security and Medicare tax from'),
    '6': new UnsupportedLine('Additional tax on IRAs, other qualified retirement plans, and other tax-favored accounts'),
    '7': new UnsupportedLine('Household employment taxes.'),
    '8': new ComputedLine((tr): number => {
      const f1040 = tr.getForm(Form1040);
      const wages = f1040.getLine('1').value(tr);
      const filingStatus = f1040.filingStatus;

      let value = 0;

      // Additional medicare tax.
      if (wages > Form8959.filingStatusLimit(filingStatus)) {
        value += tr.getForm(Form8959).getValue(tr, '18');
      }

      // Net investment income tax.
      if (wages > Form8960.filingStatusLimit(filingStatus) &&
          (tr.findForms(Form1099DIV).length || tr.findForms(Form1099INT).length)) {
        value += tr.getForm(Form8960).getValue(tr, '17');
      }

      return value;
    }),
    '9': new UnsupportedLine('Section 965 net tax liability installment from Form 965-A'),

    '10': new ComputedLine((tr): number => {
      return sumFormLines(tr, this, ['4', '5', '6', '7', '8']);
    })
  };
};
