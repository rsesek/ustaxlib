// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Form, Person } from '../core';
import { InputLine } from '../core/Line';

export interface Form1099DIVInput {
  payer: string;
  payee: Person;
  ordinaryDividends?: number;  // Includes qualifiedDividends.
  qualifiedDividends?: number;
  totalCapitalGain?: number;
  unrecaptured1250Gain?: number;
  section1202Gain?: number;
  collectiblesGain?: number;
  nondividendDistributions?: number;
  fedIncomeTax?: number;
  section199ADividends?: number;
  investmentExpenses?: number;
  foreignTaxPaid?: number;
  foreignCountryOrPosession?: string;
  cashLiquidationDistributions?: number;
  noncashLiquidationDistributions?: number;
  exemptInterestDividends?: number;
  privateActivityBondDividends?: number;
};

class Input<T extends keyof Form1099DIVInput> extends InputLine<Form1099DIVInput, T> {};

export default class Form1099DIV extends Form<Form1099DIV['_lines'], Form1099DIVInput> {
  readonly name = '1099-DIV';

  readonly supportsMultipleCopies = true;

  person() { return this.getInput('payee'); }

  protected readonly _lines = {
    'payer': new Input('payer'),
    'recipient': new Input('payee'),
    '1a': new Input('ordinaryDividends'),
    '1b': new Input('qualifiedDividends'),
    '2a': new Input('totalCapitalGain'),
    '2b': new Input('unrecaptured1250Gain'),
    '2c': new Input('section1202Gain'),
    '2d': new Input('collectiblesGain'),
    '3': new Input('nondividendDistributions'),
    '4': new Input('fedIncomeTax'),
    '5': new Input('section199ADividends'),
    '6': new Input('investmentExpenses'),
    '7': new Input('foreignTaxPaid'),
    '8': new Input('foreignCountryOrPosession'),
    '9': new Input('cashLiquidationDistributions'),
    '10': new Input('noncashLiquidationDistributions'),
    '11': new Input('exemptInterestDividends'),
    '12': new Input('privateActivityBondDividends'),
  };
}
