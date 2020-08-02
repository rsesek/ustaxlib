// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Form, TaxReturn } from '../core';
import { ComputedLine, ReferenceLine, UnsupportedLine, sumFormLines } from '../core/Line';
import { clampToZero, undefinedToZero } from '../core/Math';

import { Constants } from './TaxReturn';
import Form1040, { FilingStatus } from './Form1040';
import Schedule1 from './Schedule1';

export default class Form8960 extends Form {
  readonly name = '8960';

  readonly lines = {
    // Part 1
    // Section 6013 elections not supported.
    '1': new ReferenceLine(Form1040, '2b', 'Taxable interest'),
    '2': new ReferenceLine(Form1040, '3b', 'Ordinary dividends'),
    '3': new UnsupportedLine('Annuities'),
    '4a': new UnsupportedLine('Rental real estate, royalties, partnerships, S corporations, trusts, etc'),
    '4b': new UnsupportedLine('Adjustment for net income or loss derived in the ordinary course of a nonsection 1411 trade or business'),
    '4c': new ComputedLine((tr): number => this.getValue(tr, '4a') + this.getValue(tr, '4b')),
    '5a': new ComputedLine((tr): number => {
      return (new ReferenceLine(Form1040, '6')).value(tr) +
             undefinedToZero(new ReferenceLine(Schedule1, '4', undefined, 0).value(tr));
    }, 'Net gain or loss'),
    '5b': new UnsupportedLine('Net gain or loss from disposition of property that is not subject to net investment income tax'),
    '5c': new UnsupportedLine('Adjustment from disposition of partnership interest or S corporation stock'),
    '5d': new ComputedLine((tr): number => {
      return sumFormLines(tr, this, ['5a', '5b', '5c']);
    }),
    '6': new UnsupportedLine('Adjustments to investment income for certain CFCs and PFICs'),
    '7': new UnsupportedLine('Other modifications to investment income'),
    '8': new ComputedLine((tr): number => {
      return sumFormLines(tr, this, ['1', '2', '3', '4c', '5d', '6', '7']);
    }),

    // Part 2
    // 9a not supported - Investment interest expenses
    // 9b not supported - State, local, and foreign income tax
    // 9c not supported - Miscellaneous investment expenses
    // 9d not supported - 9a+9b+9c
    // 10 not supported - Additional modifications
    '11': new ComputedLine(() => 0, 'Total deductions and modifications'),  // Not supported - 9d+10.

    // Part 3
    '12': new ComputedLine((tr): number => this.getValue(tr, '8') - this.getValue(tr, '11'), 'Net investment income'),
    '13': new ReferenceLine(Form1040, '8b', 'Modified adjusted gross income'),
    '14': new ComputedLine((tr): number => {
      return Form8960.filingStatusLimit(tr);
    }, 'Threshold'),
    '15': new ComputedLine((tr): number => clampToZero(this.getValue(tr, '13') - this.getValue(tr, '14'))),
    '16': new ComputedLine((tr): number => Math.min(this.getValue(tr, '12'), this.getValue(tr, '15'))),
    '17': new ComputedLine((tr): number => this.getValue(tr, '16') * tr.constants.niit.rate, 'Net investment income tax'),

    // 18 - 21 not supported (Estates and Trusts)
  };

  static filingStatusLimit(tr: TaxReturn): number {
    const filingStatus = tr.getForm(Form1040).filingStatus;
    return tr.constants.niit.limit[filingStatus];
  }
};
