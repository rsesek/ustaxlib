// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Form, TaxReturn } from '../core';
import { Line, AccumulatorLine, ComputedLine, ReferenceLine, UnsupportedLine, sumFormLines } from '../core/Line';
import { clampToZero } from '../core/Math';

import Form1040, { FilingStatus } from './Form1040';
import W2 from './W2';

export default class Form8959 extends Form {
  readonly name = '8959';

  readonly lines = {
    '1': new AccumulatorLine(W2, '5', 'Medicare wages'),
    '2': new UnsupportedLine('Unreported tips from Form 4137'),
    '3': new UnsupportedLine('Wages from Form 8919'),
    '4': new ComputedLine((tr): number => {
      return sumFormLines(tr, this, ['1', '2', '3']);
    }),
    '5': new ComputedLine((tr): number => {
      return tr.constants.medicare.additionalWithholdingLimit[tr.getForm(Form1040).filingStatus];
    }),
    '6': new ComputedLine((tr): number => {
      return clampToZero(this.getValue(tr, '4') - this.getValue(tr, '5'));
    }),
    '7': new ComputedLine((tr): number => {
      return this.getValue(tr, '6') * tr.constants.medicare.additionalWithholdingRate;
    }, 'Additional Medicare tax on Medicare wages'),

    // All of Section 2 and 3 skipped.

    '18': new ComputedLine((tr): number => {
      // Should include 13 and 17.
      return this.getValue(tr, '7');
    }),

    '19': new AccumulatorLine(W2, '6', 'Medicare tax withheld'),
    '20': new ReferenceLine(Form8959 as any, '1'),
    '21': new ComputedLine((tr): number => {
      return this.getValue(tr, '20') * tr.constants.medicare.withholdingRate;
    }, 'Regular Medicare withholding on Medicare wages'),
    '22': new ComputedLine((tr): number => {
      return clampToZero(this.getValue(tr, '19') - this.getValue(tr, '21'));
    }, 'Additional Medicare withholding on Medicare wages'),
    '23': new UnsupportedLine('Additional Medicare Tax withholding on railroad retirement (RRTA) compensation'),
    '24': new ComputedLine((tr): number => {
      return this.getValue(tr, '22') + this.getValue(tr, '23');
    }),
  };

  static filingStatusLimit(tr: TaxReturn): number {
    const filingStatus = tr.getForm(Form1040).filingStatus;
    return tr.constants.medicare.additionalWithholdingLimit[filingStatus];
  }
};
