// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Form, Person, TaxReturn } from '../core';
import { InputLine } from '../core/Line';

export interface Form1099BRow {
  description: string;
  dateAcquired?: string;
  dateSold?: string;
  proceeds: number;
  costBasis: number;
  accruedMarketDiscount?: number;
  washSaleLossDisallowed?: number;
  fedIncomeTax?: number;

  adjustments?: number;  // Not reported on 1099-B, but entered as part of Form8994.
};

export interface Form1099BInput {
  payer: string;
  payee: Person;

  shortTermBasisReported?: Form1099BRow[];  // Box A checked.
  shortTermBasisUnreported?: Form1099BRow[];  // Box B checked.

  longTermBasisReported?: Form1099BRow[];  // Box D checked.
  longTermBasisUnreported?: Form1099BRow[];  // Box E checked.

  // For unreported securities, create your own 1099-B.
  shortTermUnreported?: Form1099BRow[];  // Box C checked.
  longTermUnreported?: Form1099BRow[];  // Box F checked.
};

class Input<T extends keyof Form1099BInput> extends InputLine<Form1099BInput, T> {};

export default class Form1099B extends Form<Form1099BInput> {
  readonly name = '1099-B';

  readonly supportsMultipleCopies = true;

  person() { return this.getInput('payee'); }

  readonly lines = {
    'payer': new Input('payer'),
    'recipient': new Input('payee'),
    'shortTermBasisReported': new Input('shortTermBasisReported'),
    'shortTermBasisUnreported': new Input('shortTermBasisUnreported'),
    'longTermBasisReported': new Input('longTermBasisReported'),
    'longTermBasisUnreported': new Input('longTermBasisUnreported'),
    'shortTermUnreported': new Input('shortTermUnreported'),
    'longTermUnreported': new Input('longTermUnreported'),
  };
};
